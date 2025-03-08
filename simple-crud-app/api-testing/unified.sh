#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL for the API
BASE_URL="http://localhost:3000/api"

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to make API requests and display results
call_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  
  echo -e "${BLUE}Testing: ${method} ${endpoint}${NC}"
  
  if [ -z "$data" ]; then
    # For GET and DELETE requests without a body
    response=$(curl -s -X "${method}" \
      -w "\n%{http_code}" \
      -H "Content-Type: application/json" \
      "${BASE_URL}${endpoint}")
  else
    # For POST and PUT requests with a body
    response=$(curl -s -X "${method}" \
      -w "\n%{http_code}" \
      -H "Content-Type: application/json" \
      -d "${data}" \
      "${BASE_URL}${endpoint}")
  fi
  
  # Extract status code and response body
  http_code=$(echo "$response" | tail -n1)
  response_body=$(echo "$response" | sed '$d')
  
  # Check if status code matches expected status
  if [ "$http_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ Success: Status ${http_code}${NC}"
  else
    echo -e "${RED}✗ Failed: Expected status ${expected_status}, got ${http_code}${NC}"
  fi
  
  # Print response body (prettified if jq is available)
  if command -v jq &> /dev/null && [ -n "$response_body" ]; then
    echo "$response_body" | jq
  else
    echo "$response_body"
  fi
  
  echo ""
  
  # Return response for further processing if needed
  echo "$response_body"
}

# Create test data - run before the main tests
create_test_data() {
  print_header "Creating Test Data"
  
  # Create test customer
  customer_data='{
    "first_name": "Test",
    "last_name": "Customer",
    "email": "test.customer@example.com",
    "phone": "555-123-4567",
    "address": "123 Test St, Test City"
  }'
  
  customer_response=$(call_api "POST" "/customers" "$customer_data" 201)
  customer_id=$(echo "$customer_response" | jq -r '.customer_id')
  
  # Create test publisher
  publisher_data='{
    "name": "Test Publisher",
    "address": "456 Publisher Ave, Book City",
    "phone": "555-987-6543",
    "email": "publisher@example.com"
  }'
  
  publisher_response=$(call_api "POST" "/publishers" "$publisher_data" 201)
  publisher_id=$(echo "$publisher_response" | jq -r '.publisher_id')
  
  # Create test category
  category_data='{
    "name": "Test Category",
    "description": "A category for testing"
  }'
  
  category_response=$(call_api "POST" "/categories" "$category_data" 201)
  category_id=$(echo "$category_response" | jq -r '.category_id')
  
  # Create test author
  author_data='{
    "first_name": "Test",
    "last_name": "Author",
    "email": "author@example.com",
    "birth_date": "1980-01-01"
  }'
  
  author_response=$(call_api "POST" "/authors" "$author_data" 201)
  author_id=$(echo "$author_response" | jq -r '.author_id')
  
  # Create test books
  book1_data='{
    "isbn": "1234567890123",
    "title": "Test Book 1",
    "price": 19.99,
    "publication_date": "2022-01-01",
    "stock_quantity": 50,
    "publisher_id": '"$publisher_id"',
    "category_id": '"$category_id"',
    "authors": ['"$author_id"']
  }'
  
  book2_data='{
    "isbn": "3210987654321",
    "title": "Test Book 2",
    "price": 29.99,
    "publication_date": "2022-02-15",
    "stock_quantity": 30,
    "publisher_id": '"$publisher_id"',
    "category_id": '"$category_id"',
    "authors": ['"$author_id"']
  }'
  
  book1_response=$(call_api "POST" "/books" "$book1_data" 201)
  book1_id=$(echo "$book1_response" | jq -r '.book_id')
  
  book2_response=$(call_api "POST" "/books" "$book2_data" 201)
  book2_id=$(echo "$book2_response" | jq -r '.book_id')
  
  # Save IDs for later use
  echo "$customer_id" > /tmp/test_customer_id
  echo "$book1_id" > /tmp/test_book1_id
  echo "$book2_id" > /tmp/test_book2_id
}

# Test order creation with items
test_create_order() {
  print_header "Testing Order Creation"
  
  # Load IDs from test data
  customer_id=$(cat /tmp/test_customer_id)
  book1_id=$(cat /tmp/test_book1_id)
  book2_id=$(cat /tmp/test_book2_id)
  
  order_data='{
    "customer_id": '"$customer_id"',
    "status": "Pending",
    "items": [
      {
        "book_id": '"$book1_id"',
        "quantity": 2
      },
      {
        "book_id": '"$book2_id"',
        "quantity": 1
      }
    ]
  }'
  
  order_response=$(call_api "POST" "/orders" "$order_data" 201)
  order_id=$(echo "$order_response" | jq -r '.order_id')
  
  # Save order ID for later tests
  echo "$order_id" > /tmp/test_order_id
}

# Test getting all orders
test_get_orders() {
  print_header "Testing Get All Orders"
  call_api "GET" "/orders" "" 200
  
  print_header "Testing Get Orders with Filters"
  customer_id=$(cat /tmp/test_customer_id)
  call_api "GET" "/orders?customer_id=${customer_id}&status=Pending" "" 200
}

# Test getting a single order with its items
test_get_order() {
  print_header "Testing Get Single Order"
  order_id=$(cat /tmp/test_order_id)
  call_api "GET" "/orders/${order_id}" "" 200
}

# Test updating an order
test_update_order() {
  print_header "Testing Update Order"
  order_id=$(cat /tmp/test_order_id)
  
  update_data='{
    "status": "Shipped"
  }'
  
  call_api "PUT" "/orders/${order_id}" "$update_data" 200
}

# Test adding an item to an order
test_add_order_item() {
  print_header "Testing Add Item to Order"
  order_id=$(cat /tmp/test_order_id)
  book1_id=$(cat /tmp/test_book1_id)
  
  # This would fail with a 409 since the book is already in the order
  # Using a different book would succeed with 201
  
  item_data='{
    "book_id": '"$book1_id"',
    "quantity": 1
  }'
  
  call_api "POST" "/orders/${order_id}/items" "$item_data" 409
}

# Test updating an item in an order
test_update_order_item() {
  print_header "Testing Update Order Item"
  order_id=$(cat /tmp/test_order_id)
  book1_id=$(cat /tmp/test_book1_id)
  
  update_item_data='{
    "quantity": 3
  }'
  
  call_api "PUT" "/orders/${order_id}/items/${book1_id}" "$update_item_data" 200
}

# Test removing an item from an order
test_remove_order_item() {
  print_header "Testing Remove Order Item"
  order_id=$(cat /tmp/test_order_id)
  book2_id=$(cat /tmp/test_book2_id)
  
  call_api "DELETE" "/orders/${order_id}/items/${book2_id}" "" 204
}

# Test order deletion
test_delete_order() {
  print_header "Testing Delete Order"
  order_id=$(cat /tmp/test_order_id)
  
  call_api "DELETE" "/orders/${order_id}" "" 204
  
  # Verify order is gone
  call_api "GET" "/orders/${order_id}" "" 404
}

# Cleanup temporary files
cleanup() {
  rm -f /tmp/test_customer_id /tmp/test_book1_id /tmp/test_book2_id /tmp/test_order_id
}

# Run all tests
main() {
  echo "Starting Order API Tests..."
  
  # Create test data first
  create_test_data
  
  # Run order tests
  test_create_order
  test_get_orders
  test_get_order
  test_update_order
  test_add_order_item
  test_update_order_item
  test_remove_order_item
  test_delete_order
  
  # Clean up
  cleanup
  
  echo -e "\n${GREEN}All tests completed!${NC}"
}

# Execute the main function
main