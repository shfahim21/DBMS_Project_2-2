import React, { useEffect, useState } from 'react';
import { bookAuthorsApi, booksApi, authorsApi } from '../services/api';
import '../styles/styles.css';

const BookAuthors = () => {
  const [bookAuthors, setBookAuthors] = useState([]);
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    book_id: '',
    author_id: ''
  });

  useEffect(() => {
    fetchBookAuthors();
    fetchBooks();
    fetchAuthors();
  }, []);

  const fetchBookAuthors = async () => {
    try {
      const response = await bookAuthorsApi.getAll();
      setBookAuthors(response.data);
    } catch (error) {
      console.error('Error fetching book-author relationships:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await booksApi.getAll();
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

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

  const filteredBookAuthors = bookAuthors.filter(relation =>
    relation.book_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${relation.author_first_name} ${relation.author_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.publisher_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (book_id, author_id) => {
    if (window.confirm('Are you sure you want to delete this book-author relationship?')) {
      try {
        await bookAuthorsApi.delete(book_id, author_id);
        fetchBookAuthors();
      } catch (error) {
        console.error('Error deleting book-author relationship:', error);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await bookAuthorsApi.create(formData);
      fetchBookAuthors();
      setShowModal(false);
      setFormData({ book_id: '', author_id: '' });
    } catch (error) {
      console.error('Error creating book-author relationship:', error);
    }
  };

  return (
    <div className="data-container">
      <div className="header-section">
        <input
          type="text"
          placeholder="Search book-author relationships..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button 
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          Add Book-Author Relationship
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Book Title</th>
            <th>ISBN</th>
            <th>Author</th>
            <th>Publisher</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBookAuthors.map(relation => (
            <tr key={`${relation.book_id}-${relation.author_id}`}>
              <td>{relation.book_title}</td>
              <td>{relation.isbn}</td>
              <td>{`${relation.author_first_name} ${relation.author_last_name}`}</td>
              <td>{relation.publisher_name}</td>
              <td>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(relation.book_id, relation.author_id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Book-Author Relationship</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Book:</label>
                <select
                  name="book_id"
                  value={formData.book_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a book</option>
                  {books.map(book => (
                    <option key={book.book_id} value={book.book_id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Author:</label>
                <select
                  name="author_id"
                  value={formData.author_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select an author</option>
                  {authors.map(author => (
                    <option key={author.author_id} value={author.author_id}>
                      {`${author.first_name} ${author.last_name}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="button-group">
                <button type="submit" className="submit-button">
                  Create
                </button>
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ book_id: '', author_id: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAuthors;