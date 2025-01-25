import { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchBar } from './SearchBar';
import { DataTable } from './DataTable';
import { CustomerModal } from './CustomerModal';

export function CustomersSection() {
  const [customers, setCustomers] = useState([]); // Initialize as empty array
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/customers');
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers. Please try again later.');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { header: 'ID', accessor: 'customer_id' },
    { header: 'First Name', accessor: 'first_name' },
    { header: 'Last Name', accessor: 'last_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Address', accessor: 'address' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (customer) => (
        <div className="action-buttons">
          <button 
            className="edit-button"
            onClick={() => {
              setEditingCustomer(customer);
              setIsModalOpen(true);
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
        </div>
      ),
    },
  ];

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`/api/customers/${id}`);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Loading customers...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchCustomers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="search-add-container">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <button 
          className="add-button"
          onClick={() => setIsModalOpen(true)}
        >
          Add Customer
        </button>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="no-data">No customers found</div>
      ) : (
        <DataTable columns={columns} data={filteredCustomers} />
      )}

      {isModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
          onSave={fetchCustomers}
        />
      )}
    </div>
  );
}