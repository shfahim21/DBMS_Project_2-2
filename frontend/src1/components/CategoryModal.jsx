// src/components/CategoryModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export function CategoryModal({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = category 
        ? `/api/categories/${category.category_id}`
        : '/api/categories';
      const method = category ? 'put' : 'post';
      
      await axios[method](url, formData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{category ? 'Edit Category' : 'Add New Category'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
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