#!/bin/bash

# Install jq if not present
if ! command -v jq &> /dev/null; then
    echo "jq is required. Please install it first."
    exit 1
fi

API_URL="http://localhost:3000/api"
TIMESTAMP=$(date +%s)

# Create dependencies
echo "Creating test dependencies..."
PUBLISHER_DATA=$(jq -n \
    --arg email "testpub$TIMESTAMP@example.com" \
    '{name: "Test Publisher", address: "123 Pub St", phone: "123-456-7890", email: $email}')

publisher_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$PUBLISHER_DATA" $API_URL/publishers)
publisher_id=$(echo $publisher_response | jq -r '.publisher_id')

CATEGORY_DATA=$(jq -n \
    --arg name "TestCategory$TIMESTAMP" \
    '{name: $name, description: "Test description"}')

category_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$CATEGORY_DATA" $API_URL/categories)
category_id=$(echo $category_response | jq -r '.category_id')

# Test Books endpoints
echo -e "\nTesting Books Endpoints"
echo "-----------------------"

# Test GET all books (empty)
echo "Testing GET all books (empty)"
status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/books)
[ "$status" == "200" ] && echo "✅ GET empty books list" || echo "❌ GET empty books list"

# Test POST create book
echo -e "\nTesting POST create book"
VALID_BOOK=$(jq -n \
    --arg isbn "978${TIMESTAMP:0-10}" \
    --arg pub_id "$publisher_id" \
    --arg cat_id "$category_id" \
    '{
        isbn: $isbn,
        title: "Test Book",
        price: 29.99,
        publication_date: "2023-01-01",
        stock_quantity: 10,
        publisher_id: $pub_id,
        category_id: $cat_id
    }')

# Successful creation
response=$(curl -s -X POST -H "Content-Type: application/json" -d "$VALID_BOOK" $API_URL/books)
book_id=$(echo $response | jq -r '.book_id')
if [ -n "$book_id" ]; then
    echo "✅ Book created - ID: $book_id"
else
    echo "❌ Book creation failed"
    exit 1
fi

# Test validation errors
echo -e "\nTesting validation errors:"

# Missing title
MISSING_TITLE=$(jq -n '{price: 29.99}')
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$MISSING_TITLE" $API_URL/books)
[ "$status" == "400" ] && echo "✅ Missing title detection" || echo "❌ Missing title detection"

# Invalid price
INVALID_PRICE=$(jq -n '{title: "Test", price: -10}')
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$INVALID_PRICE" $API_URL/books)
[ "$status" == "400" ] && echo "✅ Invalid price detection" || echo "❌ Invalid price detection"

# Invalid ISBN length
INVALID_ISBN=$(jq -n '{title: "Test", price: 10, isbn: "123"}')
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$INVALID_ISBN" $API_URL/books)
[ "$status" == "400" ] && echo "✅ Invalid ISBN detection" || echo "❌ Invalid ISBN detection"

# Test GET endpoints
echo -e "\nTesting GET endpoints:"

# Get all books (now with 1 item)
count=$(curl -s $API_URL/books | jq '. | length')
[ "$count" -eq 1 ] && echo "✅ GET all books count" || echo "❌ GET all books count"

# Get book by ID
retrieved_title=$(curl -s $API_URL/books/$book_id | jq -r '.title')
[ "$retrieved_title" == "Test Book" ] && echo "✅ GET book by ID" || echo "❌ GET book by ID"

# Test filters
echo -e "\nTesting filters:"

# Price filter
curl -s "$API_URL/books?min_price=20&max_price=30" | jq -e '.[].price >= 20 and .[].price <= 30' >/dev/null
[ $? -eq 0 ] && echo "✅ Price filter" || echo "❌ Price filter"

# Publisher filter
publisher_filter_count=$(curl -s "$API_URL/books?publisher_id=$publisher_id" | jq '. | length')
[ "$publisher_filter_count" -eq 1 ] && echo "✅ Publisher filter" || echo "❌ Publisher filter"

# Test PUT update
echo -e "\nTesting PUT update:"
UPDATE_DATA=$(jq -n '{title: "Updated Title", price: 39.99, stock_quantity: 5}')

# Successful update
response=$(curl -s -X PUT -H "Content-Type: application/json" -d "$UPDATE_DATA" $API_URL/books/$book_id)
updated_price=$(echo $response | jq -r '.price')
[ "$updated_price" == "39.99" ] && echo "✅ Basic update" || echo "❌ Basic update"

# Partial update
PARTIAL_UPDATE=$(jq -n '{stock_quantity: 20}')
response=$(curl -s -X PUT -H "Content-Type: application/json" -d "$PARTIAL_UPDATE" $API_URL/books/$book_id)
updated_stock=$(echo $response | jq -r '.stock_quantity')
[ "$updated_stock" == "20" ] && echo "✅ Partial update" || echo "❌ Partial update"

# Test DELETE
echo -e "\nTesting DELETE:"
status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/books/$book_id)
[ "$status" == "204" ] && echo "✅ Delete book" || echo "❌ Delete book"

# Cleanup
echo -e "\nCleaning up dependencies..."
curl -s -X DELETE $API_URL/publishers/$publisher_id >/dev/null
curl -s -X DELETE $API_URL/categories/$category_id >/dev/null

echo -e "\nAll book endpoint tests completed!"