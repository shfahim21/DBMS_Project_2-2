import { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchBar } from './SearchBar';
import { DataTable } from './DataTable';
import { CategoryModal } from './CategoryModal';

export function CategoriesSection() {
  const [categories, setCategories] = useState([]); // Initialize as empty array
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories. Please try again later.');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { header: 'ID', accessor: 'category_id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (category) => (
        <div className="action-buttons">
          <button 
            className="edit-button"
            onClick={() => {
              setEditingCategory(category);
              setIsModalOpen(true);
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
        </div>
      ),
    },
  ];

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`/api/categories/${id}`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Loading categories...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchCategories}>Retry</button>
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
          Add Category
        </button>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="no-data">No categories found</div>
      ) : (
        <DataTable columns={columns} data={filteredCategories} />
      )}

      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSave={fetchCategories}
        />
      )}
    </div>
  );
}