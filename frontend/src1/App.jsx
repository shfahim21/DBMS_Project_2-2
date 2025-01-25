// src/App.jsx
import { useState } from 'react';
import './App.css';
import { AuthorsSection, CategoriesSection, CustomersSection } from './components';

function App() {
  const [activeTab, setActiveTab] = useState('authors');

  return (
    <div className="app-container">
      <h1 className="section-title">Bookstore Management System</h1>
      
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'authors' ? 'active' : ''}`}
          onClick={() => setActiveTab('authors')}
        >
          Authors
        </button>
        <button
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
      </div>

      {activeTab === 'authors' && <AuthorsSection />}
      {activeTab === 'categories' && <CategoriesSection />}
      {activeTab === 'customers' && <CustomersSection />}
    </div>
  );
}

export default App;