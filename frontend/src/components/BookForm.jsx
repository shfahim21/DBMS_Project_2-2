import React, { useState, useEffect } from 'react';

const BookForm = ({ book, publishers, categories, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    price: '',
    publication_date: '',
    stock_quantity: 0,
    publisher_id: '',
    category_id: ''
  });

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        isbn: book.isbn || '',
        price: book.price,
        publication_date: book.publication_date?.split('T')[0] || '',
        stock_quantity: book.stock_quantity,
        publisher_id: book.publisher_id || '',
        category_id: book.category_id || ''
      });
    }
  }, [book]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price) {
      alert('Title and price are required');
      return;
    }

    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
      publication_date: formData.publication_date || null,
      publisher_id: formData.publisher_id || null,
      category_id: formData.category_id || null
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{book ? 'Edit Book' : 'New Book'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>ISBN (13 digits):</label>
            <input
              type="text"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              pattern="\d{13}"
              title="13-digit ISBN"
            />
          </div>

          <div className="form-group">
            <label>Price:</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Publication Date:</label>
            <input
              type="date"
              name="publication_date"
              value={formData.publication_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Stock Quantity:</label>
            <input
              type="number"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Publisher:</label>
            <select
              name="publisher_id"
              value={formData.publisher_id}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select Publisher</option>
              {publishers.map(publisher => (
                <option key={publisher.publisher_id} value={publisher.publisher_id}>
                  {publisher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category:</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="button-group">
            <button type="submit" className="submit-button">
              {book ? 'Update' : 'Create'}
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

export default BookForm;