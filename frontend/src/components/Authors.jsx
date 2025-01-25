import React, { useEffect, useState } from 'react';
import { authorsApi } from '../services/api';
import AuthorForm from './AuthorForm';
import '../styles/styles.css';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState(null);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await authorsApi.getAll();
      setAuthors(response.data);
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredAuthors = authors.filter(author =>
    `${author.first_name} ${author.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this author?')) {
      try {
        await authorsApi.delete(id);
        fetchAuthors();
      } catch (error) {
        console.error('Error deleting author:', error);
      }
    }
  };

  const handleFormSubmit = async (authorData) => {
    try {
      if (currentAuthor) {
        await authorsApi.update(currentAuthor.author_id, authorData);
      } else {
        await authorsApi.create(authorData);
      }
      fetchAuthors();
      setShowModal(false);
      setCurrentAuthor(null);
    } catch (error) {
      console.error('Error saving author:', error);
    }
  };

  return (
    <div className="data-container">
      <div className="header-section">
        <input
          type="text"
          placeholder="Search authors..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button 
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          Add Author
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Birth Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAuthors.map(author => (
            <tr key={author.author_id}>
              <td>{`${author.first_name} ${author.last_name}`}</td>
              <td>{author.email}</td>
              <td>{new Date(author.birth_date).toLocaleDateString()}</td>
              <td>
                <button 
                  className="edit-button"
                  onClick={() => {
                    setCurrentAuthor(author);
                    setShowModal(true);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(author.author_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <AuthorForm
          author={currentAuthor}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowModal(false);
            setCurrentAuthor(null);
          }}
        />
      )}
    </div>
  );
};

export default Authors;