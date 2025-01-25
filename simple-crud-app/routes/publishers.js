const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all publishers
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Publishers ORDER BY publisher_id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single publisher by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Publishers WHERE publisher_id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Publisher not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE new publisher
router.post('/', async (req, res) => {
    try {
        const { name, address, phone, email } = req.body;
        const result = await pool.query(
            'INSERT INTO Publishers (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, address, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE publisher
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, email } = req.body;
        
        const result = await pool.query(
            'UPDATE Publishers SET name = $1, address = $2, phone = $3, email = $4 WHERE publisher_id = $5 RETURNING *',
            [name, address, phone, email, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Publisher not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE publisher
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Publishers WHERE publisher_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Publisher not found' });
        }
        
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;