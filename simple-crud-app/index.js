// index.js
const express = require('express');
const app = express();

// Import routes
const bookRoutes = require('./routes/books');
const authorRoutes = require('./routes/authors');
const categoryRoutes = require('./routes/categories');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const publisherRoutes = require('./routes/publishers');
const bookAuthorsRoutes = require('./routes/bookauthors');
const orderDetailsRoutes = require('./routes/orderdetails');
const Unified = require('./routes/unified');

// const reviewRoutes = require('./routes/reviews');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Route middleware
app.use('/api/books', bookRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/publishers', publisherRoutes);
app.use('/api/bookauthors',bookAuthorsRoutes);
app.use('/api/orderdetails',orderDetailsRoutes);
app.use('/api/unified', Unified);


// app.use('/api/reviews', reviewRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});