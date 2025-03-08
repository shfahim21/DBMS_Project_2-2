import React, { useEffect, useState } from 'react';
import { ordersApi, customersApi } from '../services/api';
import OrderForm from './OrderForm';
import '../styles/styles.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        ordersApi.getAll(),
        customersApi.getAll()
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredOrders = orders.filter(order => 
    order.email.toLowerCase().includes(searchTerm) ||
    `${order.first_name} ${order.last_name}`.toLowerCase().includes(searchTerm)
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await ordersApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const handleFormSubmit = async (orderData) => {
    try {
      if (currentOrder) {
        await ordersApi.update(currentOrder.order_id, orderData);
      } else {
        await ordersApi.create(orderData);
      }
      fetchData();
      setShowModal(false);
      setCurrentOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  return (
    <div className="data-container">
      <div className="header-section">
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button 
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          Add Order
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Order Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.order_id}>
              <td>{`${order.order_id}`}</td>
              <td>{`${order.first_name} ${order.last_name}`}</td>
              <td>{order.email}</td>
              <td>${parseFloat(order.total_amount).toFixed(2)}</td>
              <td>
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </td>
              <td>{new Date(order.order_date).toLocaleDateString()}</td>
              <td>
                <div className="button-container">
                  <button 
                    className="edit-button"
                    onClick={() => {
                      setCurrentOrder(order);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(order.order_id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <OrderForm
          order={currentOrder}
          customers={customers}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowModal(false);
            setCurrentOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default Orders;







// const express = require('express');
// const router = express.Router();
// const pool = require('../db');

// // Create order with items
// router.post('/', async (req, res) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     // Handle customer creation if new
//     let customerId = req.body.customer_id;
//     if (req.body.new_customer) {
//       const customerRes = await client.query(
//         `INSERT INTO Customers (first_name, last_name, email)
//          VALUES ($1, $2, $3) RETURNING customer_id`,
//         [req.body.new_customer.first_name, 
//          req.body.new_customer.last_name, 
//          req.body.new_customer.email]
//       );
//       customerId = customerRes.rows[0].customer_id;
//     }

//     // Create order
//     const orderRes = await client.query(
//       `INSERT INTO Orders (customer_id, total_amount, status)
//        VALUES ($1, $2, $3) RETURNING *`,
//       [customerId, req.body.total_amount, req.body.status]
//     );
//     const order = orderRes.rows[0];

//     // Insert order items
//     for (const item of req.body.items) {
//       // Check book availability
//       const bookCheck = await client.query(
//         'SELECT stock_quantity, price FROM Books WHERE book_id = $1',
//         [item.book_id]
//       );
      
//       if (bookCheck.rows.length === 0) {
//         throw new Error(`Book ${item.book_id} not found`);
//       }
      
//       if (bookCheck.rows[0].stock_quantity < item.quantity) {
//         throw new Error(`Insufficient stock for book ${item.book_id}`);
//       }

//       // Insert order detail
//       await client.query(
//         `INSERT INTO OrderDetails 
//           (order_id, book_id, quantity, unit_price)
//          VALUES ($1, $2, $3, $4)`,
//         [order.order_id, item.book_id, item.quantity, item.unit_price]
//       );

//       // Update book stock
//       await client.query(
//         'UPDATE Books SET stock_quantity = stock_quantity - $1 WHERE book_id = $2',
//         [item.quantity, item.book_id]
//       );
//     }

//     await client.query('COMMIT');
//     res.status(201).json(order);
//   } catch (error) {
//     await client.query('ROLLBACK');
//     res.status(400).json({ error: error.message });
//   } finally {
//     client.release();
//   }
// });

// // Update order with items
// router.put('/:id', async (req, res) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     // Update order details
//     await client.query(
//       `UPDATE Orders SET
//         customer_id = $1,
//         total_amount = $2,
//         status = $3
//        WHERE order_id = $4`,
//       [req.body.customer_id, req.body.total_amount, req.body.status, req.params.id]
//     );

//     // Delete existing items
//     await client.query(
//       'DELETE FROM OrderDetails WHERE order_id = $1',
//       [req.params.id]
//     );

//     // Insert updated items
//     for (const item of req.body.items) {
//       // Similar item handling as in POST
//       // (include stock checks and updates)
//     }

//     await client.query('COMMIT');
//     res.json({ message: 'Order updated successfully' });
//   } catch (error) {
//     await client.query('ROLLBACK');
//     res.status(400).json({ error: error.message });
//   } finally {
//     client.release();
//   }
// });

// // Keep other routes (GET, DELETE) as before

// module.exports = router;