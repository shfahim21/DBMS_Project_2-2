//routes/bookaithors.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all book-author relationships with details
router.get('/', async (req, res) => {
  try {
    const { book_id, author_id } = req.query;
    let query = `
      SELECT ba.book_id, ba.author_id,
             b.title AS book_title, b.isbn, 
             a.first_name AS author_first_name, a.last_name AS author_last_name,
             p.name AS publisher_name
      FROM BookAuthors ba
      JOIN Books b ON ba.book_id = b.book_id
      JOIN Authors a ON ba.author_id = a.author_id
      LEFT JOIN Publishers p ON b.publisher_id = p.publisher_id
      WHERE 1=1
    `;
    const params = [];
    
    if (book_id) {
      query += ` AND ba.book_id = $${params.length + 1}`;
      params.push(book_id);
    }
    
    if (author_id) {
      query += ` AND ba.author_id = $${params.length + 1}`;
      params.push(author_id);
    }
    
    query += ' ORDER BY a.last_name, a.first_name, b.title';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get authors for a specific book
router.get('/book/:book_id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.author_id, a.first_name, a.last_name, a.email, a.birth_date
      FROM Authors a
      JOIN BookAuthors ba ON a.author_id = ba.author_id
      WHERE ba.book_id = $1
      ORDER BY a.last_name, a.first_name
    `, [req.params.book_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get books for a specific author
router.get('/author/:author_id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.book_id, b.title, b.isbn, b.price, b.publication_date,
             p.name AS publisher_name, c.name AS category_name
      FROM Books b
      JOIN BookAuthors ba ON b.book_id = ba.book_id
      LEFT JOIN Publishers p ON b.publisher_id = p.publisher_id
      LEFT JOIN Categories c ON b.category_id = c.category_id
      WHERE ba.author_id = $1
      ORDER BY b.publication_date DESC, b.title
    `, [req.params.author_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific book-author relationship
router.get('/:book_id/:author_id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ba.book_id, ba.author_id,
             b.title AS book_title, b.isbn, b.publication_date,
             a.first_name AS author_first_name, a.last_name AS author_last_name,
             p.name AS publisher_name
      FROM BookAuthors ba
      JOIN Books b ON ba.book_id = b.book_id
      JOIN Authors a ON ba.author_id = a.author_id
      LEFT JOIN Publishers p ON b.publisher_id = p.publisher_id
      WHERE ba.book_id = $1 AND ba.author_id = $2
    `, [req.params.book_id, req.params.author_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Book-Author relationship not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new book-author relationship
router.post('/', async (req, res) => {
  try {
    const { book_id, author_id } = req.body;

    // Validation
    if (!book_id || !author_id) {
      return res.status(400).json({ error: 'Book ID and Author ID are required' });
    }

    // Check if book exists
    const bookCheck = await pool.query(
      'SELECT book_id FROM Books WHERE book_id = $1',
      [book_id]
    );
    if (bookCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid book_id' });
    }

    // Check if author exists
    const authorCheck = await pool.query(
      'SELECT author_id FROM Authors WHERE author_id = $1',
      [author_id]
    );
    if (authorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid author_id' });
    }

    await pool.query(
      'INSERT INTO BookAuthors (book_id, author_id) VALUES ($1, $2)',
      [book_id, author_id]
    );

    // Return the created relationship with details
    const { rows } = await pool.query(`
      SELECT ba.book_id, ba.author_id,
             b.title AS book_title,
             a.first_name AS author_first_name, a.last_name AS author_last_name
      FROM BookAuthors ba
      JOIN Books b ON ba.book_id = b.book_id
      JOIN Authors a ON ba.author_id = a.author_id
      WHERE ba.book_id = $1 AND ba.author_id = $2
    `, [book_id, author_id]);

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This book-author relationship already exists' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid book or author ID' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete book-author relationship
router.delete('/:book_id/:author_id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM BookAuthors WHERE book_id = $1 AND author_id = $2',
      [req.params.book_id, req.params.author_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Book-Author relationship not found' });
    }

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;