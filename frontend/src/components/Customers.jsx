import React, { useEffect, useState } from 'react';
import { customersApi } from '../services/api';
import CustomerForm from './CustomerForm';
import '../styles/styles.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersApi.delete(id);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const handleFormSubmit = async (customerData) => {
    try {
      if (currentCustomer) {
        await customersApi.update(currentCustomer.customer_id, customerData);
      } else {
        await customersApi.create(customerData);
      }
      fetchCustomers();
      setShowModal(false);
      setCurrentCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <div className="data-container">
      <div className="header-section">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button 
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          Add Customer
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map(customer => (
            <tr key={customer.customer_id}>
              <td>{`${customer.first_name} ${customer.last_name}`}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{customer.address}</td>
              <td>
                <button 
                  className="edit-button"
                  onClick={() => {
                    setCurrentCustomer(customer);
                    setShowModal(true);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(customer.customer_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <CustomerForm
          customer={currentCustomer}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowModal(false);
            setCurrentCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default Customers;