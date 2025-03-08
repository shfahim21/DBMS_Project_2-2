import React, { useEffect, useState } from 'react';
import { orderDetailsApi, ordersApi, booksApi } from '../services/api';
import OrderDetailForm from './OrderDetailForm';
import '../styles/styles.css';

const OrderDetails = () => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentOrderDetail, setCurrentOrderDetail] = useState(null);
  const [orders, setOrders] = useState([]);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchOrderDetails();
    fetchOrders();
    fetchBooks();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderDetailsApi.getAll();
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await ordersApi.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await booksApi.getAll();
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOrderFilter = (e) => {
    setOrderFilter(e.target.value);
  };

  const filteredOrderDetails = orderDetails.filter(detail => {
    const matchesSearch = 
      detail.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.isbn?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOrderFilter = orderFilter ? 
      detail.order_id.toString() === orderFilter : true;
    
    return matchesSearch && matchesOrderFilter;
  });

  const handleDelete = async (orderId, bookId) => {
    if (window.confirm('Are you sure you want to delete this order detail?')) {
      try {
        await orderDetailsApi.delete(orderId, bookId);
        fetchOrderDetails();
      } catch (error) {
        console.error('Error deleting order detail:', error);
      }
    }
  };

  const handleFormSubmit = async (orderDetailData) => {
    try {
      if (currentOrderDetail) {
        await orderDetailsApi.update(
          currentOrderDetail.order_id, 
          currentOrderDetail.book_id, 
          orderDetailData
        );
      } else {
        await orderDetailsApi.create(orderDetailData);
      }
      fetchOrderDetails();
      setShowModal(false);
      setCurrentOrderDetail(null);
    } catch (error) {
      console.error('Error saving order detail:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="data-container">
      <div className="header-section">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search books, customers, ISBN..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <select 
            value={orderFilter} 
            onChange={handleOrderFilter}
            className="order-filter"
          >
            <option value="">All Orders</option>
            {orders.map(order => (
              <option key={order.order_id} value={order.order_id}>
                Order #{order.order_id} - {formatDate(order.order_date)}
              </option>
            ))}
          </select>
        </div>
        <button 
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          Add Order Item
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Book</th>
            <th>ISBN</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th>Order Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrderDetails.map(detail => (
            <tr key={`${detail.order_id}-${detail.book_id}`}>
              <td>{detail.order_id}</td>
              <td>{detail.customer_name}</td>
              <td>{detail.book_title}</td>
              <td>{detail.isbn}</td>
              <td>{detail.quantity}</td>
              <td>{formatCurrency(detail.unit_price)}</td>
              <td>{formatCurrency(detail.quantity * detail.unit_price)}</td>
              <td>{formatDate(detail.order_date)}</td>
              <td>
                <span className={`status-badge status-${detail.order_status?.toLowerCase()}`}>
                  {detail.order_status}
                </span>
              </td>
              <td>
                <button 
                  className="edit-button"
                  onClick={() => {
                    setCurrentOrderDetail(detail);
                    setShowModal(true);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(detail.order_id, detail.book_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <OrderDetailForm
          orderDetail={currentOrderDetail}
          orders={orders}
          books={books}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowModal(false);
            setCurrentOrderDetail(null);
          }}
        />
      )}
    </div>
  );
};

export default OrderDetails;