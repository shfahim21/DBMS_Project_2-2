const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all books with optional filters
router.get('/', async (req, res) => {
  try {
    const { publisher_id, category_id, min_price, max_price } = req.query;
    let query = `
      SELECT b.*, p.name AS publisher_name, c.name AS category_name 
      FROM Books b
      LEFT JOIN Publishers p ON b.publisher_id = p.publisher_id
      LEFT JOIN Categories c ON b.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];
    
    if (publisher_id) {
      query += ` AND b.publisher_id = $${params.length + 1}`;
      params.push(publisher_id);
    }
    
    if (category_id) {
      query += ` AND b.category_id = $${params.length + 1}`;
      params.push(category_id);
    }
    
    if (min_price) {
        const minPrice = parseFloat(min_price);
        if (isNaN(minPrice)) {
          return res.status(400).json({ error: 'Invalid min_price value' });
        }
        query += ` AND b.price >= $${params.length + 1}`;
        params.push(minPrice);
      }
      
      if (max_price) {
        const maxPrice = parseFloat(max_price);
        if (isNaN(maxPrice)) {
          return res.status(400).json({ error: 'Invalid max_price value' });
        }
        query += ` AND b.price <= $${params.length + 1}`;
        params.push(maxPrice);
      }

    query += ' ORDER BY b.title';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single book with details
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.*, p.name AS publisher_name, c.name AS category_name 
      FROM Books b
      LEFT JOIN Publishers p ON b.publisher_id = p.publisher_id
      LEFT JOIN Categories c ON b.category_id = c.category_id
      WHERE b.book_id = $1
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new book
router.post('/', async (req, res) => {
  try {
    const { 
      isbn,
      title,
      price,
      publication_date,
      stock_quantity,
      publisher_id,
      category_id
    } = req.body;

    // Validation
    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    if (isbn && isbn.length !== 13) {
      return res.status(400).json({ error: 'ISBN must be 13 characters' });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'Price must be positive' });
    }

    if (stock_quantity && stock_quantity < 0) {
      return res.status(400).json({ error: 'Stock quantity cannot be negative' });
    }

    // Check publisher exists if provided
    if (publisher_id) {
      const publisherCheck = await pool.query(
        'SELECT publisher_id FROM Publishers WHERE publisher_id = $1',
        [publisher_id]
      );
      if (publisherCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid publisher_id' });
      }
    }

    // Check category exists if provided
    if (category_id) {
      const categoryCheck = await pool.query(
        'SELECT category_id FROM Categories WHERE category_id = $1',
        [category_id]
      );
      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid category_id' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO Books (
        isbn, title, price, publication_date, 
        stock_quantity, publisher_id, category_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        isbn,
        title,
        price,
        publication_date,
        stock_quantity || 0,  // Default to 0 if not provided
        publisher_id,
        category_id
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'ISBN already exists' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid publisher or category ID' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update book
router.put('/:id', async (req, res) => {
  try {
    const { 
      title,
      price,
      stock_quantity,
      publisher_id,
      category_id
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    // Validate and build update query
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      params.push(title);
    }

    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({ error: 'Price must be positive' });
      }
      updates.push(`price = $${paramCount++}`);
      params.push(price);
    }

    if (stock_quantity !== undefined) {
      if (stock_quantity < 0) {
        return res.status(400).json({ error: 'Stock quantity cannot be negative' });
      }
      updates.push(`stock_quantity = $${paramCount++}`);
      params.push(stock_quantity);
    }

    if (publisher_id !== undefined) {
      if (publisher_id) {
        const publisherCheck = await pool.query(
          'SELECT publisher_id FROM Publishers WHERE publisher_id = $1',
          [publisher_id]
        );
        if (publisherCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid publisher_id' });
        }
      }
      updates.push(`publisher_id = $${paramCount++}`);
      params.push(publisher_id);
    }

    if (category_id !== undefined) {
      if (category_id) {
        const categoryCheck = await pool.query(
          'SELECT category_id FROM Categories WHERE category_id = $1',
          [category_id]
        );
        if (categoryCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid category_id' });
        }
      }
      updates.push(`category_id = $${paramCount++}`);
      params.push(category_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    params.push(req.params.id);
    const query = `
      UPDATE Books
      SET ${updates.join(', ')}
      WHERE book_id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'ISBN already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete book
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM Books WHERE book_id = $1',
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(204).end();
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete book with existing related records'
      });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;