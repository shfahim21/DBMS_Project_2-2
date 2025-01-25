const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all orders with customer details
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, c.first_name, c.last_name, c.email 
      FROM Orders o
      JOIN Customers c ON o.customer_id = c.customer_id
      ORDER BY o.order_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order with details
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, c.first_name, c.last_name, c.email 
      FROM Orders o
      JOIN Customers c ON o.customer_id = c.customer_id
      WHERE order_id = $1
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { customer_id, total_amount, status = 'Pending' } = req.body;

    // Validation
    if (!customer_id || !total_amount) {
      return res.status(400).json({ error: 'Missing required fields: customer_id and total_amount are required' });
    }

    if (isNaN(total_amount) || total_amount <= 0) {
      return res.status(400).json({ error: 'Invalid total_amount: must be a positive number' });
    }

    const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }

    // Check customer exists
    const customerCheck = await pool.query(
      'SELECT customer_id FROM Customers WHERE customer_id = $1',
      [customer_id]
    );
    
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { rows } = await pool.query(
      `INSERT INTO Orders 
       (customer_id, total_amount, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [customer_id, total_amount, status]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid customer_id' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const { status, total_amount, customer_id } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Validate and build update query
    if (status) {
      const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status',
          valid_statuses: validStatuses
        });
      }
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (total_amount) {
      if (isNaN(total_amount) || total_amount <= 0) {
        return res.status(400).json({ error: 'Invalid total_amount: must be a positive number' });
      }
      updates.push(`total_amount = $${paramCount++}`);
      values.push(total_amount);
    }

    if (customer_id) {
      // Check customer exists
      const customerCheck = await pool.query(
        'SELECT customer_id FROM Customers WHERE customer_id = $1',
        [customer_id]
      );
      
      if (customerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      updates.push(`customer_id = $${paramCount++}`);
      values.push(customer_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    values.push(req.params.id);
    const query = `
      UPDATE Orders
      SET ${updates.join(', ')}
      WHERE order_id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid customer_id' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM Orders WHERE order_id = $1',
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(204).end();
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete order with existing related records'
      });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;