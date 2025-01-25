const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assuming you have a db connection setup

// GET all customers
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Customers ORDER BY customer_id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single customer by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Customers WHERE customer_id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE new customer
router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, email, phone, address } = req.body;
        const result = await pool.query(
            'INSERT INTO Customers (first_name, last_name, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [first_name, last_name, email, phone, address]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, address } = req.body;
        
        const result = await pool.query(
            'UPDATE Customers SET first_name = $1, last_name = $2, email = $3, phone = $4, address = $5 WHERE customer_id = $6 RETURNING *',
            [first_name, last_name, email, phone, address, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Customers WHERE customer_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;