import React, { useState, useEffect } from 'react';

const OrderForm = ({ order, customers, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    total_amount: '',
    status: 'Pending'
  });

  useEffect(() => {
    if (order) {
      setFormData({
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        status: order.status
      });
    }
  }, [order]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.total_amount) {
      alert('Please fill all required fields');
      return;
    }
    onSubmit({
      ...formData,
      total_amount: parseFloat(formData.total_amount)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{order ? 'Edit Order' : 'New Order'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer:</label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {`${customer.first_name} ${customer.last_name} (${customer.email})`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Total Amount:</label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Status:</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="button-group">
            <button type="submit" className="submit-button">
              {order ? 'Update' : 'Create'}
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;