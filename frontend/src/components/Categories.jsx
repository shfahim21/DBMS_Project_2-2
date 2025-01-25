import React, { useEffect, useState } from 'react';
import { categoriesApi } from '../services/api';
import CategoryForm from './CategoryForm';
import '../styles/styles.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoriesApi.delete(id);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleFormSubmit = async (categoryData) => {
    try {
      if (currentCategory) {
        await categoriesApi.update(currentCategory.category_id, categoryData);
      } else {
        await categoriesApi.create(categoryData);
      }
      fetchCategories();
      setShowModal(false);
      setCurrentCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  return (
    <div className="data-container">
      <div className="header-section">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button 
          className="add-button"
          onClick={() => setShowModal(true)}
        >
          Add Category
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map(category => (
            <tr key={category.category_id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <button 
                  className="edit-button"
                  onClick={() => {
                    setCurrentCategory(category);
                    setShowModal(true);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(category.category_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <CategoryForm
          category={currentCategory}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowModal(false);
            setCurrentCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default Categories;