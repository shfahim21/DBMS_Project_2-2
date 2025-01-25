import React, { useEffect, useState } from 'react';
import { publishersApi } from '../services/api';
import PublisherForm from './PublisherForm';
import '../styles/styles.css';

const Publishers = () => {
  const [publishers, setPublishers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPublisher, setCurrentPublisher] = useState(null);

  useEffect(() => {
    fetchPublishers();
  }, []);

  const fetchPublishers = async () => {
    try {
      const response = await publishersApi.getAll();
      setPublishers(response.data);
    } catch (error) {
      console.error('Error fetching publishers:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredPublishers = publishers.filter(publisher =>
    publisher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    publisher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this publisher?')) {
      try {
        await publishersApi.delete(id);
        fetchPublishers();
      } catch (error) {
        console.error('Error deleting publisher:', error);
      }
    }
  };

  const handleFormSubmit = async (publisherData) => {
    try {
      if (currentPublisher) {
        await publishersApi.update(currentPublisher.publisher_id, publisherData);
      } else {
        await publishersApi.create(publisherData);
      }
      fetchPublishers();
      setShowModal(false);
      setCurrentPublisher(null);
    } catch (error) {
      console.error('Error saving publisher:', error);
    }
  };

  return (
    <div className="data-container">
      <div className="header-section">
        <input
          type="text"
          placeholder="Search publishers..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button 
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          Add Publisher
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPublishers.map(publisher => (
            <tr key={publisher.publisher_id}>
              <td>{publisher.name}</td>
              <td>{publisher.address}</td>
              <td>{publisher.phone}</td>
              <td>{publisher.email}</td>
              <td>
                <div className="button-container">
                  <button 
                    className="edit-button"
                    onClick={() => {
                      setCurrentPublisher(publisher);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(publisher.publisher_id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <PublisherForm
          publisher={currentPublisher}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowModal(false);
            setCurrentPublisher(null);
          }}
        />
      )}
    </div>
  );
};

export default Publishers;