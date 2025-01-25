import { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchBar } from './SearchBar';
import { DataTable } from './DataTable';
import { AuthorModal } from './AuthorModal';

export function AuthorsSection() {
  const [authors, setAuthors] = useState([]);  // Initialize as empty array
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/authors');
      setAuthors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching authors:', error);
      setError('Failed to fetch authors. Please try again later.');
      setAuthors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAuthors = authors.filter(author =>
    `${author.first_name} ${author.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    author.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { header: 'ID', accessor: 'author_id' },
    { header: 'First Name', accessor: 'first_name' },
    { header: 'Last Name', accessor: 'last_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Birth Date', accessor: 'birth_date' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (author) => (
        <div className="action-buttons">
          <button
            className="edit-button"
            onClick={() => {
              setEditingAuthor(author);
              setIsModalOpen(true);
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
        </div>
      ),
    },
  ];

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this author?')) {
      try {
        await axios.delete(`/api/authors/${id}`);
        fetchAuthors();
      } catch (error) {
        console.error('Error deleting author:', error);
        alert('Failed to delete author. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Loading authors...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchAuthors}>Retry</button>
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
          Add Author
        </button>
      </div>

      {filteredAuthors.length === 0 ? (
        <div className="no-data">No authors found</div>
      ) : (
        <DataTable columns={columns} data={filteredAuthors} />
      )}

      {isModalOpen && (
        <AuthorModal
          author={editingAuthor}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAuthor(null);
          }}
          onSave={fetchAuthors}
        />
      )}
    </div>
  );
}