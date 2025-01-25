#!/bin/bash

# Install jq if not present
if ! command -v jq &> /dev/null; then
    echo "jq is required. Please install it first."
    exit 1
fi

API_URL="http://localhost:3000/api"
TIMESTAMP=$(date +%s)

# Test Customers endpoints
echo "Testing Customers Endpoints"
echo "---------------------------"

# Create customer
CUSTOMER_DATA=$(jq -n \
    --arg email "testuser$TIMESTAMP@example.com" \
    '{first_name: "Test", last_name: "User", email: $email, address: "123 Test St"}')

response=$(curl -s -X POST -H "Content-Type: application/json" -d "$CUSTOMER_DATA" $API_URL/customers)
customer_id=$(echo $response | jq -r '.customer_id')
if [ -z "$customer_id" ]; then
    echo "❌ Create customer failed"
    exit 1
fi
echo "✅ Customer created - ID: $customer_id"

# Get customer
response=$(curl -s $API_URL/customers/$customer_id)
status=$(echo $response | jq -r '.customer_id')
[ "$status" == "$customer_id" ] && echo "✅ Get customer" || echo "❌ Get customer"

# Get all customers
status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/customers)
[ "$status" == "200" ] && echo "✅ Get all customers" || echo "❌ Get all customers"

# Update customer
UPDATE_DATA=$(jq -n \
    --arg email "updated$TIMESTAMP@example.com" \
    '{first_name: "Updated", last_name: "Name", email: $email, address: "456 Updated St"}')

status=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "Content-Type: application/json" -d "$UPDATE_DATA" $API_URL/customers/$customer_id)
[ "$status" == "200" ] && echo "✅ Update customer" || echo "❌ Update customer"

# Delete customer
status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/customers/$customer_id)
[ "$status" == "204" ] && echo "✅ Delete customer" || echo "❌ Delete customer"

# Test Authors endpoints
echo -e "\nTesting Authors Endpoints"
echo "-------------------------"

# Create author
AUTHOR_DATA=$(jq -n \
    --arg email "testauthor$TIMESTAMP@example.com" \
    '{first_name: "John", last_name: "Doe", email: $email, birth_date: "1980-01-01"}')

response=$(curl -s -X POST -H "Content-Type: application/json" -d "$AUTHOR_DATA" $API_URL/authors)
author_id=$(echo $response | jq -r '.author_id')
if [ -z "$author_id" ]; then
    echo "❌ Create author failed"
    exit 1
fi
echo "✅ Author created - ID: $author_id"

# Get author
response=$(curl -s $API_URL/authors/$author_id)
status=$(echo $response | jq -r '.author_id')
[ "$status" == "$author_id" ] && echo "✅ Get author" || echo "❌ Get author"

# Get all authors
status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/authors)
[ "$status" == "200" ] && echo "✅ Get all authors" || echo "❌ Get all authors"

# Update author
UPDATE_DATA=$(jq -n \
    --arg email "testauthor$TIMESTAMP@example.com" \
    '{first_name: "Jane", last_name: "Smith", email: $email, birth_date: "1990-02-15"}')

status=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "Content-Type: application/json" -d "$UPDATE_DATA" $API_URL/authors/$author_id)
[ "$status" == "200" ] && echo "✅ Update author" || echo "❌ Update author"

# Delete author
status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/authors/$author_id)
[ "$status" == "204" ] && echo "✅ Delete author" || echo "❌ Delete author"

# Test Categories endpoints
echo -e "\nTesting Categories Endpoints"
echo "---------------------------"

# Create category
CATEGORY_DATA=$(jq -n \
    --arg name "TestCategory$TIMESTAMP" \
    '{name: $name, description: "Test description"}')

response=$(curl -s -X POST -H "Content-Type: application/json" -d "$CATEGORY_DATA" $API_URL/categories)
category_id=$(echo $response | jq -r '.category_id')
if [ -z "$category_id" ]; then
    echo "❌ Create category failed"
    exit 1
fi
echo "✅ Category created - ID: $category_id"

# Get category
response=$(curl -s $API_URL/categories/$category_id)
status=$(echo $response | jq -r '.category_id')
[ "$status" == "$category_id" ] && echo "✅ Get category" || echo "❌ Get category"

# Get all categories
status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/categories)
[ "$status" == "200" ] && echo "✅ Get all categories" || echo "❌ Get all categories"

# Update category
UPDATE_DATA=$(jq -n \
    --arg name "TestCategory$TIMESTAMP" \
    '{name: $name, description: "Updated description"}')

status=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "Content-Type: application/json" -d "$UPDATE_DATA" $API_URL/categories/$category_id)
[ "$status" == "200" ] && echo "✅ Update category" || echo "❌ Update category"

# Delete category
status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/categories/$category_id)
[ "$status" == "204" ] && echo "✅ Delete category" || echo "❌ Delete category"

echo -e "\nAll tests completed!"