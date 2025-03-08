import React, { useState, useEffect } from 'react';

const OrderDetailForm = ({ orderDetail, orders, books, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    order_id: '',
    book_id: '',
    quantity: 1,
    unit_price: ''
  });
  const [bookStock, setBookStock] = useState(0);
  const [originalQuantity, setOriginalQuantity] = useState(0);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (orderDetail) {
      setFormData({
        order_id: orderDetail.order_id,
        book_id: orderDetail.book_id,
        quantity: orderDetail.quantity,
        unit_price: orderDetail.unit_price
      });
      setOriginalQuantity(orderDetail.quantity);
      setIsEdit(true);
    }
  }, [orderDetail]);

  useEffect(() => {
    if (formData.book_id && books.length > 0) {
      const selectedBook = books.find(book => book.book_id === Number(formData.book_id));
      if (selectedBook) {
        if (!isEdit) {
          setFormData(prev => ({
            ...prev,
            unit_price: selectedBook.price
          }));
        }
        setBookStock(selectedBook.stock_quantity);
      }
    }
  }, [formData.book_id, books, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'unit_price' ? 
        Number(value) : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.order_id || !formData.book_id) {
      alert('Please select both order and book');
      return;
    }
    
    if (formData.quantity <= 0) {
      alert('Quantity must be greater than zero');
      return;
    }
    
    const availableStock = isEdit ? 
      bookStock + originalQuantity : bookStock;
      
    if (formData.quantity > availableStock) {
      alert(`Not enough stock available. Maximum available: ${availableStock}`);
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEdit ? 'Edit Order Item' : 'Add New Order Item'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Order:</label>
            <select
              name="order_id"
              value={formData.order_id}
              onChange={handleChange}
              required
              disabled={isEdit}
            >
              <option value="">Select an order</option>
              {orders.map(order => (
                <option key={order.order_id} value={order.order_id}>
                  Order #{order.order_id} - {new Date(order.order_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Book:</label>
            <select
              name="book_id"
              value={formData.book_id}
              onChange={handleChange}
              required
              disabled={isEdit}
            >
              <option value="">Select a book</option>
              {books.map(book => (
                <option key={book.book_id} value={book.book_id}>
                  {book.title} (ISBN: {book.isbn}) - Stock: {book.stock_quantity}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />
            {bookStock > 0 && (
              <span className="stock-info">
                Available: {isEdit ? bookStock + originalQuantity : bookStock}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label>Unit Price:</label>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>
          
          <div className="button-group">
            <button type="submit" className="submit-button">
              {isEdit ? 'Update' : 'Add to Order'}
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

export default OrderDetailForm;