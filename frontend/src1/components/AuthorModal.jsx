// src/components/AuthorModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export function AuthorModal({ author, onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    birth_date: ''
  });

  useEffect(() => {
    if (author) {
      setFormData({
        first_name: author.first_name,
        last_name: author.last_name,
        email: author.email,
        birth_date: author.birth_date
      });
    }
  }, [author]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (author) {
        await axios.put(`/api/authors/${author.author_id}`, formData);
      } else {
        await axios.post('/api/authors', formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving author:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{author ? 'Edit Author' : 'Add New Author'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="form-input"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="form-input"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Birth Date</label>
            <input
              className="form-input"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
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