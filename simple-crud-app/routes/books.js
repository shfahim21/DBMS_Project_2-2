const express = require('express');
const router = express.Router();
const pool = require('../config/db');
// const { validateBook } = require('../middleware/validation');

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
  
