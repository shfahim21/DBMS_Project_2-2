import React, { useEffect, useState } from 'react';
import { booksApi, publishersApi, categoriesApi } from '../services/api';
import BookForm from './BookForm';
import '../styles/styles.css';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentBook, setCurrentBook] = useState(null);
  const [filters, setFilters] = useState({
    publisher_id: '',
    category_id: '',
    min_price: '',
    max_price: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [booksRes, publishersRes, categoriesRes] = await Promise.all([
        booksApi.getAll(filters),
        publishersApi.getAll(),
        categoriesApi.getAll()
      ]);
      
      setBooks(booksRes.data);
      setPublishers(publishersRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      publisher_id: '',
      category_id: '',
      min_price: '',
      max_price: ''
    });
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm) ||
    book.isbn?.toLowerCase().includes(searchTerm)
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const handleFormSubmit = async (bookData) => {
    try {
      if (currentBook) {
        await booksApi.update(currentBook.book_id, bookData);
      } else {
        await booksApi.create(bookData);
      }
      fetchData();
      setShowModal(false);
      setCurrentBook(null);
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  return (
    <div className="data-container">
      <div className="header-section">
        <input
          type="text"
          placeholder="Search books..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button 
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          Add Book
        </button>
      </div>

      <div className="filter-section">
        <select
          name="publisher_id"
          value={filters.publisher_id}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Publishers</option>
          {publishers.map(publisher => (
            <option key={publisher.publisher_id} value={publisher.publisher_id}>
              {publisher.name}
            </option>
          ))}
        </select>

        <select
          name="category_id"
          value={filters.category_id}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.category_id} value={category.category_id}>
              {category.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="min_price"
          placeholder="Min Price"
          value={filters.min_price}
          onChange={handleFilterChange}
          className="price-filter"
          min="0"
        />

        <input
          type="number"
          name="max_price"
          placeholder="Max Price"
          value={filters.max_price}
          onChange={handleFilterChange}
          className="price-filter"
          min="0"
        />

        <button onClick={clearFilters} className="clear-filters">
          Clear Filters
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>ISBN</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Publisher</th>
            <th>Category</th>
            <th>Published</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.map(book => (
            <tr key={book.book_id}>
              <td>{book.title}</td>
              <td className="isbn">{book.isbn}</td>
              <td>${parseFloat(book.price).toFixed(2)}</td>
              <td>
                <span className={`stock ${book.stock_quantity <= 5 ? 'low-stock' : ''}`}>
                  {book.stock_quantity}
                </span>
              </td>
              <td>{book.publisher_name}</td>
              <td>{book.category_name}</td>
              <td>{new Date(book.publication_date).toLocaleDateString()}</td>
              <td>
                <div className="button-container">
                  <button 
                    className="edit-button"
                    onClick={() => {
                      setCurrentBook(book);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(book.book_id)}
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
        <BookForm
          book={currentBook}
          publishers={publishers}
          categories={categories}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowModal(false);
            setCurrentBook(null);
          }}
        />
      )}
    </div>
  );
};

export default Books;