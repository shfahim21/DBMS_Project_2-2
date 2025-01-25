import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // Update with your backend URL
});

export const customersApi = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};

//  Authors API
export const authorsApi = {
  getAll: () => api.get('/authors'),
  getById: (id) => api.get(`/authors/${id}`),
  create: (data) => api.post('/authors', data),
  update: (id, data) => api.put(`/authors/${id}`, data),
  delete: (id) => api.delete(`/authors/${id}`)
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// services/api.js
export const publishersApi = {
    getAll: () => api.get('/publishers'),
    getById: (id) => api.get(`/publishers/${id}`),
    create: (data) => api.post('/publishers', data),
    update: (id, data) => api.put(`/publishers/${id}`, data),
    delete: (id) => api.delete(`/publishers/${id}`)
  };

  export const ordersApi = {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    update: (id, data) => api.put(`/orders/${id}`, data),
    delete: (id) => api.delete(`/orders/${id}`)
  };

  export const booksApi = {
    getAll: (params) => api.get('/books', { params }),
    getById: (id) => api.get(`/books/${id}`),
    create: (data) => api.post('/books', data),
    update: (id, data) => api.put(`/books/${id}`, data),
    delete: (id) => api.delete(`/books/${id}`)
  };