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