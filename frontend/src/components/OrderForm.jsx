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





// import React, { useState, useEffect } from 'react';

// const OrderForm = ({ order, customers, books, onSuccess, onClose }) => {
//   const [formData, setFormData] = useState({
//     customer: { id: '', isNew: false, details: {} },
//     status: 'Pending',
//     items: [],
//     total: 0
//   });

//   useEffect(() => {
//     if (order) {
//       const initializeForm = async () => {
//         try {
//           const detailsRes = await ordersApi.getDetails(order.order_id);
//           setFormData({
//             customer: { id: order.customer_id, isNew: false },
//             status: order.status,
//             items: detailsRes.data.map(item => ({
//               book_id: item.book_id,
//               quantity: item.quantity,
//               price: item.unit_price
//             })),
//             total: order.total_amount
//           });
//         } catch (error) {
//           console.error('Error initializing form:', error);
//         }
//       };
//       initializeForm();
//     }
//   }, [order]);

//   const handleCustomerChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       customer: { ...prev.customer, [field]: value }
//     }));
//   };

//   const handleItemChange = (index, field, value) => {
//     const newItems = [...formData.items];
//     newItems[index][field] = value;
    
//     if (field === 'book_id') {
//       const selectedBook = books.find(b => b.book_id == value);
//       if (selectedBook) {
//         newItems[index].price = selectedBook.price;
//       }
//     }
    
//     const total = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
//     setFormData(prev => ({ ...prev, items: newItems, total }));
//   };

//   const addItem = () => {
//     setFormData(prev => ({
//       ...prev,
//       items: [...prev.items, { book_id: '', quantity: 1, price: 0 }]
//     }));
//   };

//   const removeItem = (index) => {
//     const newItems = formData.items.filter((_, i) => i !== index);
//     const total = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
//     setFormData(prev => ({ ...prev, items: newItems, total }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     try {
//       const payload = {
//         customer_id: formData.customer.id,
//         status: formData.status,
//         total_amount: formData.total,
//         items: formData.items.map(item => ({
//           book_id: item.book_id,
//           quantity: item.quantity,
//           unit_price: item.price
//         }))
//       };

//       if (order) {
//         await ordersApi.update(order.order_id, payload);
//       } else {
//         await ordersApi.create(payload);
//       }
      
//       onSuccess();
//     } catch (error) {
//       console.error('Error saving order:', error);
//       alert('Failed to save order: ' + error.message);
//     }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content wide-modal">
//         <h2>{order ? 'Edit Order' : 'Create New Order'}</h2>
//         <form onSubmit={handleSubmit}>
//           <div className="form-section">
//             <h3>Customer Information</h3>
//             <div className="customer-selection">
//               <select
//                 value={formData.customer.id}
//                 onChange={(e) => handleCustomerChange('id', e.target.value)}
//                 required
//               >
//                 <option value="">Select Existing Customer</option>
//                 {customers.map(customer => (
//                   <option key={customer.customer_id} value={customer.customer_id}>
//                     {`${customer.first_name} ${customer.last_name}`}
//                   </option>
//                 ))}
//               </select>
//               <span className="or-divider">OR</span>
//               <button 
//                 type="button" 
//                 className="toggle-button"
//                 onClick={() => handleCustomerChange('isNew', !formData.customer.isNew)}
//               >
//                 {formData.customer.isNew ? 'Use Existing Customer' : 'Create New Customer'}
//               </button>
//             </div>

//             {formData.customer.isNew && (
//               <div className="new-customer-fields">
//                 <input
//                   type="text"
//                   placeholder="First Name"
//                   required
//                   onChange={(e) => handleCustomerChange('details', {
//                     ...formData.customer.details,
//                     first_name: e.target.value
//                   })}
//                 />
//                 <input
//                   type="text"
//                   placeholder="Last Name"
//                   required
//                   onChange={(e) => handleCustomerChange('details', {
//                     ...formData.customer.details,
//                     last_name: e.target.value
//                   })}
//                 />
//                 <input
//                   type="email"
//                   placeholder="Email"
//                   required
//                   onChange={(e) => handleCustomerChange('details', {
//                     ...formData.customer.details,
//                     email: e.target.value
//                   })}
//                 />
//               </div>
//             )}
//           </div>

//           <div className="form-section">
//             <h3>Order Items</h3>
//             <div className="items-list">
//               {formData.items.map((item, index) => (
//                 <div key={index} className="item-row">
//                   <select
//                     value={item.book_id}
//                     onChange={(e) => handleItemChange(index, 'book_id', e.target.value)}
//                     required
//                   >
//                     <option value="">Select Book</option>
//                     {books.map(book => (
//                       <option key={book.book_id} value={book.book_id}>
//                         {book.title} (${book.price})
//                       </option>
//                     ))}
//                   </select>
//                   <input
//                     type="number"
//                     min="1"
//                     value={item.quantity}
//                     onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
//                     required
//                   />
//                   <span className="price-display">
//                     ${(item.quantity * item.price).toFixed(2)}
//                   </span>
//                   <button
//                     type="button"
//                     className="remove-item"
//                     onClick={() => removeItem(index)}
//                   >
//                     ×
//                   </button>
//                 </div>
//               ))}
//               <button type="button" className="add-item" onClick={addItem}>
//                 Add Item
//               </button>
//             </div>
//           </div>

//           <div className="form-section">
//             <h3>Order Summary</h3>
//             <div className="summary-row">
//               <label>Status:</label>
//               <select
//                 value={formData.status}
//                 onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
//                 required
//               >
//                 <option value="Pending">Pending</option>
//                 <option value="Shipped">Shipped</option>
//                 <option value="Delivered">Delivered</option>
//                 <option value="Cancelled">Cancelled</option>
//               </select>
//             </div>
//             <div className="summary-row total-row">
//               <label>Total Amount:</label>
//               <span className="total-amount">${formData.total.toFixed(2)}</span>
//             </div>
//           </div>

//           <div className="form-actions">
//             <button type="submit" className="primary-button">
//               {order ? 'Update Order' : 'Create Order'}
//             </button>
//             <button type="button" className="secondary-button" onClick={onClose}>
//               Cancel
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default OrderForm;