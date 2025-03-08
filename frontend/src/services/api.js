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

  // export const ordersApi = {
  //   getAll: () => axios.get('/api/orders'),
  //   getById: (id) => axios.get(`/api/orders/${id}`),
  //   create: (data) => axios.post('/api/orders', data),
  //   update: (id, data) => axios.put(`/api/orders/${id}`, data),
  //   delete: (id) => axios.delete(`/api/orders/${id}`)
  // };
  
  

  export const booksApi = {
    getAll: (params) => api.get('/books', { params }),
    getById: (id) => api.get(`/books/${id}`),
    create: (data) => api.post('/books', data),
    update: (id, data) => api.put(`/books/${id}`, data),
    delete: (id) => api.delete(`/books/${id}`)
  };

  export const bookAuthorsApi = {
    getAll: () => api.get('/bookauthors'),
    getAuthorsByBook: (bookId) => api.get(`/bookauthors/book/${bookId}`),
    getBooksByAuthor: (authorId) => api.get(`/bookauthors/author/${authorId}`),
    getOne: (bookId, authorId) => api.get(`/bookauthors/${bookId}/${authorId}`),
    create: (data) => api.post('/bookauthors', data),
    delete: (bookId, authorId) => api.delete(`/bookauthors/${bookId}/${authorId}`)
  };

  export const orderDetailsApi = {
    getAll: () => api.get('/orderdetails'),
    getByOrder: (orderId) => api.get(`/orderdetails?order_id=${orderId}`),
    getByBook: (bookId) => api.get(`/orderdetails?book_id=${bookId}`),
    getOne: (orderId, bookId) => api.get(`/orderdetails/${orderId}/${bookId}`),
    create: (data) => api.post('/orderdetails', data),
    update: (orderId, bookId, data) => api.put(`/orderdetails/${orderId}/${bookId}`, data),
    delete: (orderId, bookId) => api.delete(`/orderdetails/${orderId}/${bookId}`)
  };
  

  // export const ordersApi = {
  //   // Basic CRUD operations
  //   getAll: (params) => api.get('/api/unified', { params }),
  //   getById: (id) => api.get(`/api/unified/${id}`),
  //   create: (data) => api.post('/api/unified', data),
  //   update: (id, data) => api.put(`/api/unified/${id}`, data),
  //   delete: (id) => api.delete(`/api/unified/${id}`),
  
  //   // Order items operations
  //   addItem: (orderId, data) => api.post(`/api/unified/${orderId}/items`, data),
  //   updateItem: (orderId, bookId, data) => api.put(`/api/unified/${orderId}/items/${bookId}`, data),
  //   removeItem: (orderId, bookId) => api.delete(`/api/unified/${orderId}/items/${bookId}`),
  
  //   // Additional order-specific operations
  //   getWithFilters: (filters) => api.get('/api/unified', { 
  //     params: {
  //       customer_id: filters.customerId,
  //       status: filters.status,
  //       start_date: filters.startDate,
  //       end_date: filters.endDate
  //     }
  //   }),
  
  //   updateStatus: (id, status) => api.put(`/api/unified/${id}`, { status }),
  
  //   // Helper method for getting order details with items
  //   getFullDetails: async (id) => {
  //     const response = await api.get(`/api/unified/${id}`);
  //     return {
  //       ...response.data,
  //       items: response.data.items || []
  //     };
  //   }
  // };