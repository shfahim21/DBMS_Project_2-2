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