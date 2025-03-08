#!/bin/bash

# Base URL
API_URL="http://localhost:3000/api"

# Set text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Bookstore Management API...${NC}"

# Function to make API requests and display results
call_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "\n${YELLOW}$description${NC}"
  echo -e "Request: $method $endpoint"
  
  if [ -n "$data" ]; then
    echo -e "Payload: $data"
    response=$(curl -s -X $method -H "Content-Type: application/json" -d "$data" "$API_URL$endpoint")
  else
    response=$(curl -s -X $method "$API_URL$endpoint")
  fi
  
  echo -e "Response: $response"
  
  if [[ $response == *"error"* ]]; then
    echo -e "${RED}✗ Test failed${NC}"
  else
    echo -e "${GREEN}✓ Test passed${NC}"
  fi
  
  # Return the response for further processing if needed
  echo "$response"
}

# ===== TESTING BOOK AUTHORS ENDPOINTS =====
# echo -e "\n${YELLOW}===== TESTING BOOK AUTHORS ENDPOINTS =====${NC}"

# # Get all book-author relationships
# call_api "GET" "/bookauthors" "" "Get all book-author relationships"

# # Get authors for a specific book (assuming book_id 1 exists)
# call_api "GET" "/bookauthors/book/1" "" "Get authors for book_id 1"

# # Get books for a specific author (assuming author_id 1 exists)
# call_api "GET" "/bookauthors/author/1" "" "Get books for author_id 1"

# # Create a new book-author relationship (assuming book_id 1 and author_id 2 exist)
# response=$(call_api "POST" "/bookauthors" '{"book_id": 1, "author_id": 2}' "Create a new book-author relationship")

# # Extract book_id and author_id from response for later tests
# book_id=$(echo "$response" | grep -o '"book_id":[0-9]*' | cut -d':' -f2)
# author_id=$(echo "$response" | grep -o '"author_id":[0-9]*' | cut -d':' -f2)

# if [ -n "$book_id" ] && [ -n "$author_id" ]; then
#   # Get specific book-author relationship
#   call_api "GET" "/bookauthors/$book_id/$author_id" "" "Get specific book-author relationship"
  
#   # Delete book-author relationship
#   call_api "DELETE" "/bookauthors/$book_id/$author_id" "" "Delete book-author relationship"
# else
#   echo -e "${RED}Could not extract book_id and author_id from response for further tests${NC}"
# fi

# ===== TESTING ORDER DETAILS ENDPOINTS =====
echo -e "\n${YELLOW}===== TESTING ORDER DETAILS ENDPOINTS =====${NC}"

# Get all order details
call_api "GET" "/orderdetails" "" "Get all order details"

# Get order details for a specific order (assuming order_id 1 exists)
call_api "GET" "/orderdetails?order_id=1" "" "Get order details for order_id 1"

# Create a new order detail (assuming order_id 1 and book_id 1 exist with sufficient stock)
response=$(call_api "POST" "/orderdetails" '{"order_id": 1, "book_id": 1, "quantity": 2, "unit_price": 19.99}' "Create a new order detail")

# Extract order_id and book_id from response for later tests
order_id=$(echo "$response" | grep -o '"order_id":[0-9]*' | cut -d':' -f2)
book_id=$(echo "$response" | grep -o '"book_id":[0-9]*' | cut -d':' -f2)

if [ -n "$order_id" ] && [ -n "$book_id" ]; then
  # Get specific order detail
  call_api "GET" "/orderdetails/$order_id/$book_id" "" "Get specific order detail"
  
  # Update order detail
  call_api "PUT" "/orderdetails/$order_id/$book_id" '{"quantity": 3}' "Update order detail quantity"
  
  # Delete order detail
  call_api "DELETE" "/orderdetails/$order_id/$book_id" "" "Delete order detail"
else
  echo -e "${RED}Could not extract order_id and book_id from response for further tests${NC}"
fi

echo -e "\n${GREEN}Testing complete!${NC}"