# #!/bin/bash

# # Test Script for Orders Endpoints
# # Requires: curl, jq

# API_URL="http://localhost:3000/api"
# TIMESTAMP=$(date +%s)

# # Install jq if missing
# if ! command -v jq &> /dev/null; then
#     echo "jq is required. Please install it first."
#     exit 1
# fi

# # Create test customer first
# echo "Creating test customer..."
# CUSTOMER_DATA=$(jq -n \
#     --arg email "order.test.$TIMESTAMP@example.com" \
#     '{first_name: "OrderTest", last_name: "User", email: $email, address: "123 Order Test St"}')

# CUSTOMER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$CUSTOMER_DATA" $API_URL/customers)
# CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.customer_id')

# if [ -z "$CUSTOMER_ID" ] || [ "$CUSTOMER_ID" == "null" ]; then
#     echo "❌ Failed to create test customer"
#     exit 1
# fi
# echo "✅ Test customer created - ID: $CUSTOMER_ID"

# # Test Orders Endpoints
# echo -e "\nTesting Orders Endpoints"
# echo "------------------------"

# # Create Order
# echo -n "1. Creating order... "
# ORDER_DATA=$(jq -n \
#     --argjson customer_id "$CUSTOMER_ID" \
#     '{customer_id: $customer_id, total_amount: 99.99, status: "Pending"}')

# CREATE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$ORDER_DATA" $API_URL/orders)
# ORDER_ID=$(echo $CREATE_RESPONSE | jq -r '.order_id')

# if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" == "null" ]; then
#     echo "❌ Failed"
#     exit 1
# else
#     echo "✅ Created - ID: $ORDER_ID"
# fi

# # Get Single Order
# echo -n "2. Getting single order... "
# GET_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/orders/$ORDER_ID)
# if [ "$GET_RESPONSE" == "200" ]; then
#     echo "✅ Success"
# else
#     echo "❌ Failed (Status: $GET_RESPONSE)"
# fi

# # Get All Orders
# echo -n "3. Getting all orders... "
# LIST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/orders)
# if [ "$LIST_RESPONSE" == "200" ]; then
#     echo "✅ Success"
# else
#     echo "❌ Failed (Status: $LIST_RESPONSE)"
# fi

# # Update Order
# echo -n "4. Updating order... "
# UPDATE_DATA=$(jq -n '{status: "Shipped", total_amount: 109.99}')
# UPDATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "Content-Type: application/json" -d "$UPDATE_DATA" $API_URL/orders/$ORDER_ID)
# if [ "$UPDATE_RESPONSE" == "200" ]; then
#     echo "✅ Success"
# else
#     echo "❌ Failed (Status: $UPDATE_RESPONSE)"
# fi

# # Validate Update
# echo -n "5. Verifying update... "
# UPDATED_ORDER=$(curl -s $API_URL/orders/$ORDER_ID)
# NEW_STATUS=$(echo $UPDATED_ORDER | jq -r '.status')
# NEW_AMOUNT=$(echo $UPDATED_ORDER | jq -r '.total_amount')

# if [ "$NEW_STATUS" == "Shipped" ] && [ "$NEW_AMOUNT" == "109.99" ]; then
#     echo "✅ Values match"
# else
#     echo "❌ Values mismatch (Status: $NEW_STATUS, Amount: $NEW_AMOUNT)"
# fi

# # Test Invalid Updates
# echo -n "6. Testing invalid status... "
# INVALID_DATA=$(jq -n '{status: "Invalid"}')
# INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "Content-Type: application/json" -d "$INVALID_DATA" $API_URL/orders/$ORDER_ID)
# [ "$INVALID_RESPONSE" == "400" ] && echo "✅ Correctly rejected" || echo "❌ Unexpected response: $INVALID_RESPONSE"

# # Delete Order
# echo -n "7. Deleting order... "
# DELETE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/orders/$ORDER_ID)
# if [ "$DELETE_RESPONSE" == "204" ]; then
#     echo "✅ Success"
# else
#     echo "❌ Failed (Status: $DELETE_RESPONSE)"
# fi

# # Verify Deletion
# echo -n "8. Verifying deletion... "
# GET_DELETED_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/orders/$ORDER_ID)
# if [ "$GET_DELETED_RESPONSE" == "404" ]; then
#     echo "✅ Correctly missing"
# else
#     echo "❌ Still exists (Status: $GET_DELETED_RESPONSE)"
# fi

# # # Cleanup
# # echo -n "9. Cleaning up test customer... "
# # CLEANUP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/customers/$CUSTOMER_ID)
# # [ "$CLEANUP_RESPONSE" == "204" ] && echo "✅ Done" || echo "❌ Cleanup failed"

# echo -e "\nOrder Tests Completed!"








#!/bin/bash

# Create new order with customer and items
echo "Creating complete order..."
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "status": "Pending",
    "items": [
      {"book_id": 1, "quantity": 2},
      {"book_id": 2, "quantity": 1}
    ]
  }'

echo -e "\n\nCreating order with new customer..."
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "new_customer": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    },
    "status": "Pending",
    "items": [
      {"book_id": 3, "quantity": 1}
    ]
  }'

# Update existing order
echo -e "\n\nUpdating order..."
curl -X PUT http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Shipped",
    "items": [
      {"book_id": 1, "quantity": 3},
      {"book_id": 3, "quantity": 2}
    ]
  }'

echo -e "\n\nTesting completed."