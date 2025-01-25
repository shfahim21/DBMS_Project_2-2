#!/bin/bash

echo "Testing Book API endpoints..."

# Test CREATE
echo "Testing CREATE endpoint..."
CREATE=$(curl -s -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": 1003,
    "isbn": "978-0000000002",
    "title": "Script Test Book",
    "price": 9.99,
    "stock_quantity": 20,
    "publisher_id": 1,
    "category_id": 1,
    "publication_date": "2023-01-01"
  }')

echo "CREATE Response: $CREATE"
BOOK_ID=$(echo $CREATE | jq -r '.book_id')
if [[ $BOOK_ID == "1003" ]]; then
  echo "CREATE: ✅"
else
  echo "CREATE: ❌"
  echo "Error: $(echo $CREATE | jq -r '.error')"
fi

sleep 1

# Test UPDATE
echo "Testing UPDATE endpoint..."
UPDATE=$(curl -s -X PUT http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 14.34}')

echo "UPDATE Response: $UPDATE"
PRICE=$(echo $UPDATE | jq -r '.price')
if [[ $PRICE == "14.99" ]]; then
  echo "UPDATE: ✅"
else
  echo "UPDATE: ❌"
  echo "Error: $(echo $UPDATE | jq -r '.error')"
fi

sleep 1

# Test DELETE
echo "Testing DELETE endpoint..."
DELETE=$(curl -s -X DELETE http://localhost:3000/api/books/1003)
echo "DELETE Response: $DELETE"
DELETE_ID=$(echo $DELETE | jq -r '.book_id')

if [[ $DELETE_ID == "1003" ]]; then
  echo "DELETE: ✅"
else
  echo "DELETE: ❌"
  echo "Error: $(echo $DELETE | jq -r '.error')"
fi

# Test Publishers endpoints
echo -e "\nTesting Publishers Endpoints"
echo "---------------------------"

# Create publisher
PUBLISHER_DATA=$(jq -n \
    --arg email "testpublisher$TIMESTAMP@example.com" \
    '{name: "Test Publisher", address: "789 Publishing Rd", phone: "123-456-7890", email: $email}')

response=$(curl -s -X POST -H "Content-Type: application/json" -d "$PUBLISHER_DATA" $API_URL/publishers)
publisher_id=$(echo $response | jq -r '.publisher_id')
if [ -z "$publisher_id" ]; then
    echo "❌ Create publisher failed"
    exit 1
fi
echo "✅ Publisher created - ID: $publisher_id"

# Get publisher
response=$(curl -s $API_URL/publishers/$publisher_id)
status=$(echo $response | jq -r '.publisher_id')
[ "$status" == "$publisher_id" ] && echo "✅ Get publisher" || echo "❌ Get publisher"

# Get all publishers
status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/publishers)
[ "$status" == "200" ] && echo "✅ Get all publishers" || echo "❌ Get all publishers"

# Update publisher
UPDATE_DATA=$(jq -n \
    --arg email "updated.publisher$TIMESTAMP@example.com" \
    '{name: "Updated Publisher", address: "456 Updated Ave", phone: "987-654-3210", email: $email}')

status=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "Content-Type: application/json" -d "$UPDATE_DATA" $API_URL/publishers/$publisher_id)
[ "$status" == "200" ] && echo "✅ Update publisher" || echo "❌ Update publisher"

# Delete publisher
status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/publishers/$publisher_id)
[ "$status" == "204" ] && echo "✅ Delete publisher" || echo "❌ Delete publisher"