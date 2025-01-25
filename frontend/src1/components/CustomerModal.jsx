// src/components/CustomerModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export function CustomerModal({ customer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || ''
      });
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = customer 
        ? `/api/customers/${customer.customer_id}`
        : '/api/customers';
      const method = customer ? 'put' : 'post';
      
      await axios[method](url, formData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{customer ? 'Edit Customer' : 'Add New Customer'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              className="form-input"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              className="form-input"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows="3"
            />
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <button type="button" className="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" style={{ marginLeft: '10px' }}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}