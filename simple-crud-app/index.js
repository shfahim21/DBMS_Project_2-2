//dont change the comment
//index.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');
const { validate: isUUID } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

// Input validation middleware
const validateBook = (req, res, next) => {
    const { isbn, title, price, stock_quantity } = req.body;
    
    if (!isbn || !title || !price || stock_quantity === undefined) {
        return res.status(400).json({ error: 'Required fields are missing' });
    }
    
    if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: 'Invalid price' });
    }
    
    if (isNaN(stock_quantity) || stock_quantity < 0) {
        return res.status(400).json({ error: 'Invalid stock quantity' });
    }
    
    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};




// Books Routes with Transaction Support
app.post('/api/books', validateBook, async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { 
            book_id, // Changed from id to book_id
            isbn, title, price, publication_date, 
            stock_quantity, publisher_id, category_id,
            author_ids
        } = req.body;

        // Insert book with book_id
        const bookResult = await client.query(
            `INSERT INTO Books (book_id, isbn, title, price, publication_date, 
                stock_quantity, publisher_id, category_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
            [book_id, isbn, title, price, publication_date, stock_quantity, publisher_id, category_id]
        );

        // Handle author associations if provided
        if (author_ids && Array.isArray(author_ids)) {
            for (const authorId of author_ids) {
                await client.query(
                    'INSERT INTO BookAuthors (book_id, author_id) VALUES ($1, $2)',
                    [bookResult.rows[0].book_id, authorId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(bookResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// Enhanced GET books with filtering, sorting, and pagination
app.get('/api/books', async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sort = 'title', 
            order = 'ASC',
            category,
            publisher,
            search
        } = req.query;

        let query = `
            SELECT b.*, p.name as publisher_name, c.name as category_name,
                   STRING_AGG(CONCAT(a.first_name, ' ', a.last_name), ', ') as authors
            FROM Books b
            LEFT JOIN Publishers p ON b.publisher_id = p.publisher_id
            LEFT JOIN Categories c ON b.category_id = c.category_id
            LEFT JOIN BookAuthors ba ON b.book_id = ba.book_id
            LEFT JOIN Authors a ON ba.author_id = a.author_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (category) {
            params.push(category);
            query += ` AND c.category_id = $${params.length}`;
        }
        
        if (publisher) {
            params.push(publisher);
            query += ` AND p.publisher_id = $${params.length}`;
        }
        
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (b.title ILIKE $${params.length} OR b.isbn LIKE $${params.length})`;
        }

        query += `
            GROUP BY b.book_id, p.name, c.name
            ORDER BY ${sort} ${order}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const { rows } = await pool.query(query, params);
        
        // Get total count for pagination
        const countResult = await pool.query('SELECT COUNT(*) FROM Books');
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            data: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (err) {
        next(err);
    }
});

// Enhanced GET single book with full details
app.get('/api/books/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const bookResult = await pool.query(`
            SELECT b.*, 
                   p.name as publisher_name, 
                   c.name as category_name,
                   json_agg(json_build_object(
                       'author_id', a.author_id,
                       'first_name', a.first_name,
                       'last_name', a.last_name
                   )) as authors,
                   (SELECT json_agg(r.*) 
                    FROM Reviews r 
                    WHERE r.book_id = b.book_id) as reviews
            FROM Books b
            LEFT JOIN Publishers p ON b.publisher_id = p.publisher_id
            LEFT JOIN Categories c ON b.category_id = c.category_id
            LEFT JOIN BookAuthors ba ON b.book_id = ba.book_id
            LEFT JOIN Authors a ON ba.author_id = a.author_id
            WHERE b.book_id = $1
            GROUP BY b.book_id, p.name, c.name
        `, [id]);

        if (bookResult.rows.length === 0) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.json(bookResult.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Continue with other routes...

app.put('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { book_id, isbn, title, price, publication_date, stock_quantity, publisher_id, category_id } = req.body;
        const updateBook = await pool.query(
            'UPDATE Books SET book_id = $1, isbn = $2, title = $3, price = $4, publication_date = $5, stock_quantity = $6, publisher_id = $7, category_id = $8 WHERE book_id = $9 RETURNING *',
            [book_id, isbn, title, price, publication_date, stock_quantity, publisher_id, category_id, id]
        );
        if (updateBook.rows.length === 0) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json({ message: 'Book updated successfully', book: updateBook.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
  
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleteBook = await pool.query('DELETE FROM Books WHERE book_id = $1 RETURNING *', [id]);
      if (deleteBook.rows.length === 0) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json({ message: 'Book deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  


// Additional routes for publishers 
// Get all publishers
app.get('/api/publishers', async (req, res) => {
    try {
        const publishers = await pool.query('SELECT * FROM Publishers ORDER BY publisher_id');
        res.json(publishers.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single publisher
app.get('/api/publishers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const publisher = await pool.query('SELECT * FROM Publishers WHERE publisher_id = $1', [id]);
        
        if (publisher.rows.length === 0) {
            return res.status(404).json({ message: "Publisher not found" });
        }
        
        res.json(publisher.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new publisher
app.post('/api/publishers', async (req, res) => {
    try {
        const { publisher_id, name, address, phone, email } = req.body;
        const newPublisher = await pool.query(
            'INSERT INTO Publishers (publisher_id, name, address, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [publisher_id, name, address, phone, email]
        );
        res.status(201).json(newPublisher.rows[0]);
    } catch (err) {
        // Handle unique constraint violation
        if (err.code === '23505') { // PostgreSQL unique violation code
            return res.status(400).json({ error: 'Publisher ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update publisher
app.put('/api/publishers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { publisher_id, name, address, phone, email } = req.body;
        
        const updatePublisher = await pool.query(
            `UPDATE Publishers 
             SET publisher_id = $1, name = $2, address = $3, phone = $4, email = $5 
             WHERE publisher_id = $6 
             RETURNING *`,
            [publisher_id, name, address, phone, email, id]
        );

        if (updatePublisher.rows.length === 0) {
            return res.status(404).json({ message: "Publisher not found" });
        }

        res.json(updatePublisher.rows[0]);
    } catch (err) {
        // Handle unique constraint violation
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Publisher ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete publisher
app.delete('/api/publishers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check for related books before deletion
        const relatedBooks = await pool.query(
            'SELECT COUNT(*) FROM Books WHERE publisher_id = $1',
            [id]
        );

        if (relatedBooks.rows[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete publisher with associated books' 
            });
        }

        const deleteResult = await pool.query(
            'DELETE FROM Publishers WHERE publisher_id = $1 RETURNING *',
            [id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: "Publisher not found" });
        }

        res.json({ message: 'Publisher deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get publisher's books
app.get('/api/publishers/:id/books', async (req, res) => {
    try {
        const { id } = req.params;
        const books = await pool.query(
            'SELECT * FROM Books WHERE publisher_id = $1 ORDER BY title',
            [id]
        );
        res.json(books.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});  
















// Validation middleware for categories
const validateCategory = (req, res, next) => {
    const { category_id, name, description } = req.body;

    if (!category_id || !Number.isInteger(Number(category_id))) {
        return res.status(400).json({ error: 'Valid category ID is required' });
    }

    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required' });
    }

    next();
};

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await pool.query('SELECT * FROM Categories ORDER BY category_id');
        res.json(categories.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single category
app.get('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await pool.query(
            'SELECT * FROM Categories WHERE category_id = $1',
            [id]
        );

        if (category.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new category
app.post('/api/categories', validateCategory, async (req, res) => {
    try {
        const { category_id, name, description } = req.body;
        const newCategory = await pool.query(
            'INSERT INTO Categories (category_id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [category_id, name, description]
        );
        res.status(201).json(newCategory.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // PostgreSQL unique violation code
            return res.status(400).json({ error: 'Category ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update category
app.put('/api/categories/:id', validateCategory, async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, description } = req.body;

        const updateCategory = await pool.query(
            `UPDATE Categories 
             SET category_id = $1, name = $2, description = $3 
             WHERE category_id = $4 
             RETURNING *`,
            [category_id, name, description, id]
        );

        if (updateCategory.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(updateCategory.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Category ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete category
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check for related books before deletion
        const relatedBooks = await pool.query(
            'SELECT COUNT(*) FROM Books WHERE category_id = $1',
            [id]
        );

        if (relatedBooks.rows[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category with associated books' 
            });
        }

        const deleteResult = await pool.query(
            'DELETE FROM Categories WHERE category_id = $1 RETURNING *',
            [id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get category's books
app.get('/api/categories/:id/books', async (req, res) => {
    try {
        const { id } = req.params;
        const books = await pool.query(
            'SELECT * FROM Books WHERE category_id = $1 ORDER BY title',
            [id]
        );
        res.json(books.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
  
  



  // Authors Routes
app.get('/api/authors', async (req, res) => {
    try {
        const authors = await pool.query('SELECT * FROM Authors ORDER BY author_id');
        res.json(authors.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/authors', async (req, res) => {
    try {
        const { author_id, first_name, last_name, email, birth_date } = req.body;
        const newAuthor = await pool.query(
            'INSERT INTO Authors (author_id, first_name, last_name, email, birth_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [author_id, first_name, last_name, email, birth_date]
        );
        res.json(newAuthor.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/authors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { author_id, first_name, last_name, email, birth_date } = req.body;
        const updateAuthor = await pool.query(
            'UPDATE Authors SET author_id = $1, first_name = $2, last_name = $3, email = $4, birth_date = $5 WHERE author_id = $6 RETURNING *',
            [author_id, first_name, last_name, email, birth_date, id]
        );
        
        if (updateAuthor.rows.length === 0) {
            return res.status(404).json({ message: "Author not found" });
        }
        
        res.json(updateAuthor.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/authors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteResult = await pool.query('DELETE FROM Authors WHERE author_id = $1 RETURNING *', [id]);
        
        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: "Author not found" });
        }
        
        res.json({ message: 'Author deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



  // Get all customers
// Validation middleware for customers
const validateCustomer = (req, res, next) => {
    const { customer_id, first_name, last_name, email, phone, address } = req.body;

    if (!customer_id || !Number.isInteger(Number(customer_id))) {
        return res.status(400).json({ error: 'Valid customer ID is required' });
    }

    if (!first_name || first_name.trim().length === 0) {
        return res.status(400).json({ error: 'First name is required' });
    }

    if (!last_name || last_name.trim().length === 0) {
        return res.status(400).json({ error: 'Last name is required' });
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    if (phone && !phone.match(/^\+?[\d\s-]+$/)) {
        return res.status(400).json({ error: 'Invalid phone format' });
    }

    if (!address || address.trim().length === 0) {
        return res.status(400).json({ error: 'Address is required' });
    }

    next();
};

// Get all customers
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await pool.query(
            'SELECT * FROM Customers ORDER BY customer_id'
        );
        res.json(customers.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single customer
app.get('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await pool.query(
            'SELECT * FROM Customers WHERE customer_id = $1',
            [id]
        );

        if (customer.rows.length === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json(customer.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new customer
app.post('/api/customers', validateCustomer, async (req, res) => {
    try {
        const { customer_id, first_name, last_name, email, phone, address } = req.body;
        const newCustomer = await pool.query(
            `INSERT INTO Customers (customer_id, first_name, last_name, email, phone, address, registration_date) 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) 
             RETURNING *`,
            [customer_id, first_name, last_name, email, phone, address]
        );
        res.status(201).json(newCustomer.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            if (err.constraint.includes('email')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(400).json({ error: 'Customer ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update customer
app.put('/api/customers/:id', validateCustomer, async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_id, first_name, last_name, email, phone, address } = req.body;

        const updateCustomer = await pool.query(
            `UPDATE Customers 
             SET customer_id = $1, first_name = $2, last_name = $3, 
                 email = $4, phone = $5, address = $6 
             WHERE customer_id = $7 
             RETURNING *`,
            [customer_id, first_name, last_name, email, phone, address, id]
        );

        if (updateCustomer.rows.length === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json(updateCustomer.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            if (err.constraint.includes('email')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(400).json({ error: 'Customer ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check for related orders before deletion
        const relatedOrders = await pool.query(
            'SELECT COUNT(*) FROM Orders WHERE customer_id = $1',
            [id]
        );

        if (relatedOrders.rows[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete customer with existing orders' 
            });
        }

        const deleteResult = await pool.query(
            'DELETE FROM Customers WHERE customer_id = $1 RETURNING *',
            [id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get customer's orders
app.get('/api/customers/:id/orders', async (req, res) => {
    try {
        const { id } = req.params;
        const orders = await pool.query(
            'SELECT * FROM Orders WHERE customer_id = $1 ORDER BY order_date DESC',
            [id]
        );
        res.json(orders.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
      const orders = await pool.query('SELECT * FROM Orders ORDER BY order_id');
      res.json(orders.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Add a new order
app.post('/api/orders', async (req, res) => {
  try {
      const { customer_id, total_amount, status } = req.body;
      const newOrder = await pool.query(
          'INSERT INTO Orders (customer_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
          [customer_id, total_amount, status]
      );
      res.status(201).json(newOrder.rows[0]);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Update an order
app.put('/api/orders/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { customer_id, total_amount, status } = req.body;
      const updateOrder = await pool.query(
          'UPDATE Orders SET customer_id = $1, total_amount = $2, status = $3 WHERE order_id = $4 RETURNING *',
          [customer_id, total_amount, status, id]
      );
      if (updateOrder.rows.length === 0) {
          return res.status(404).json({ message: "Order not found" });
      }
      res.json(updateOrder.rows[0]);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Delete an order
app.delete('/api/orders/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const deleteOrder = await pool.query('DELETE FROM Orders WHERE order_id = $1 RETURNING *', [id]);
      if (deleteOrder.rows.length === 0) {
          return res.status(404).json({ message: "Order not found" });
      }
      res.json({ message: 'Order deleted successfully' });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
      const reviews = await pool.query('SELECT * FROM Reviews ORDER BY review_id');
      res.json(reviews.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Add a new review
app.post('/api/reviews', async (req, res) => {
  try {
      const { book_id, customer_id, rating, review_text } = req.body;
      const newReview = await pool.query(
          'INSERT INTO Reviews (book_id, customer_id, rating, review_text) VALUES ($1, $2, $3, $4) RETURNING *',
          [book_id, customer_id, rating, review_text]
      );
      res.status(201).json(newReview.rows[0]);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Update a review
app.put('/api/reviews/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { book_id, customer_id, rating, review_text } = req.body;
      const updateReview = await pool.query(
          'UPDATE Reviews SET book_id = $1, customer_id = $2, rating = $3, review_text = $4 WHERE review_id = $5 RETURNING *',
          [book_id, customer_id, rating, review_text, id]
      );
      if (updateReview.rows.length === 0) {
          return res.status(404).json({ message: "Review not found" });
      }
      res.json(updateReview.rows[0]);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Delete a review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const deleteReview = await pool.query('DELETE FROM Reviews WHERE review_id = $1 RETURNING *', [id]);
      if (deleteReview.rows.length === 0) {
          return res.status(404).json({ message: "Review not found" });
      }
      res.json({ message: 'Review deleted successfully' });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});





// Global error handler
app.use(errorHandler);

// Server startup
const startServer = async () => {
    try {
        await pool.query('SELECT 1'); // Test database connection
        app.listen(port, () => {
            console.log(`Bookstore Server is running on http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down gracefully...');
    try {
        await pool.end();
        console.log('Database pool has ended');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);