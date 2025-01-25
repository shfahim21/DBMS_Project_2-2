const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming you have a db module for PostgreSQL connection

// Get all authors
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM Authors ORDER BY author_id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single author
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM Authors WHERE author_id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create author
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, birth_date } = req.body;
    
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows } = await db.query(
      'INSERT INTO Authors (first_name, last_name, email, birth_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [first_name, last_name, email, birth_date]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update author
router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, birth_date } = req.body;
    const { rows } = await db.query(
      'UPDATE Authors SET first_name = $1, last_name = $2, email = $3, birth_date = $4 WHERE author_id = $5 RETURNING *',
      [first_name, last_name, email, birth_date, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete author
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM Authors WHERE author_id = $1', [req.params.id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;