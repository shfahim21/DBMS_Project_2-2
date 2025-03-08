//orders.js
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

// const express = require('express');
// const router = express.Router();
// const pool = require('../db');



// // Get all orders with customer info
// router.get('/', async (req, res) => {
//   try {
//     const { rows } = await pool.query(`
//       SELECT 
//         o.order_id,
//         o.order_date,
//         o.total_amount,
//         o.status,
//         c.customer_id,
//         c.first_name,
//         c.last_name,
//         c.email
//       FROM Orders o
//       JOIN Customers c ON o.customer_id = c.customer_id
//       ORDER BY o.order_date DESC
//     `);
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Get single order with details
// router.get('/:id', async (req, res) => {
//   try {
//     const orderQuery = pool.query(
//       `SELECT 
//         o.*,
//         c.first_name,
//         c.last_name,
//         c.email,
//         c.address
//       FROM Orders o
//       JOIN Customers c ON o.customer_id = c.customer_id
//       WHERE o.order_id = $1`,
//       [req.params.id]
//     );

//     const detailsQuery = pool.query(
//       `SELECT 
//         od.*,
//         b.title,
//         b.isbn
//       FROM OrderDetails od
//       JOIN Books b ON od.book_id = b.book_id
//       WHERE od.order_id = $1`,
//       [req.params.id]
//     );

//     const [orderRes, detailsRes] = await Promise.all([orderQuery, detailsQuery]);
    
//     if (orderRes.rows.length === 0) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     res.json({
//       ...orderRes.rows[0],
//       items: detailsRes.rows
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



// // Get details for a specific order
// router.get('/order/:order_id', async (req, res) => {
//   try {
//     const { rows } = await pool.query(`
//       SELECT 
//         od.*,
//         b.title,
//         b.isbn,
//         b.price
//       FROM OrderDetails od
//       JOIN Books b ON od.book_id = b.book_id
//       WHERE od.order_id = $1
//     `, [req.params.order_id]);

//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Get all order details (for admin view)
// router.get('/', async (req, res) => {
//   try {
//     const { rows } = await pool.query(`
//       SELECT 
//         od.*,
//         o.order_date,
//         o.status AS order_status,
//         c.first_name || ' ' || c.last_name AS customer_name,
//         b.title AS book_title
//       FROM OrderDetails od
//       JOIN Orders o ON od.order_id = o.order_id
//       JOIN Customers c ON o.customer_id = c.customer_id
//       JOIN Books b ON od.book_id = b.book_id
//     `);
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // Create order with items
// router.post('/', async (req, res) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     // Handle customer creation if new
//     let customerId = req.body.customer_id;
//     if (req.body.new_customer) {
//       const customerRes = await client.query(
//         `INSERT INTO Customers (first_name, last_name, email)
//          VALUES ($1, $2, $3) RETURNING customer_id`,
//         [req.body.new_customer.first_name, 
//          req.body.new_customer.last_name, 
//          req.body.new_customer.email]
//       );
//       customerId = customerRes.rows[0].customer_id;
//     }

//     // Create order
//     const orderRes = await client.query(
//       `INSERT INTO Orders (customer_id, total_amount, status)
//        VALUES ($1, $2, $3) RETURNING *`,
//       [customerId, req.body.total_amount, req.body.status]
//     );
//     const order = orderRes.rows[0];

//     // Insert order items
//     for (const item of req.body.items) {
//       // Check book availability
//       const bookCheck = await client.query(
//         'SELECT stock_quantity, price FROM Books WHERE book_id = $1',
//         [item.book_id]
//       );
      
//       if (bookCheck.rows.length === 0) {
//         throw new Error(`Book ${item.book_id} not found`);
//       }
      
//       if (bookCheck.rows[0].stock_quantity < item.quantity) {
//         throw new Error(`Insufficient stock for book ${item.book_id}`);
//       }

//       // Insert order detail
//       await client.query(
//         `INSERT INTO OrderDetails 
//           (order_id, book_id, quantity, unit_price)
//          VALUES ($1, $2, $3, $4)`,
//         [order.order_id, item.book_id, item.quantity, item.unit_price]
//       );

//       // Update book stock
//       await client.query(
//         'UPDATE Books SET stock_quantity = stock_quantity - $1 WHERE book_id = $2',
//         [item.quantity, item.book_id]
//       );
//     }

//     await client.query('COMMIT');
//     res.status(201).json(order);
//   } catch (error) {
//     await client.query('ROLLBACK');
//     res.status(400).json({ error: error.message });
//   } finally {
//     client.release();
//   }
// });

// // Update order with items
// router.put('/:id', async (req, res) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     // Update order details
//     await client.query(
//       `UPDATE Orders SET
//         customer_id = $1,
//         total_amount = $2,
//         status = $3
//        WHERE order_id = $4`,
//       [req.body.customer_id, req.body.total_amount, req.body.status, req.params.id]
//     );

//     // Delete existing items
//     await client.query(
//       'DELETE FROM OrderDetails WHERE order_id = $1',
//       [req.params.id]
//     );

//     // Insert updated items
//     for (const item of req.body.items) {
//       // Similar item handling as in POST
//       // (include stock checks and updates)
//     }

//     await client.query('COMMIT');
//     res.json({ message: 'Order updated successfully' });
//   } catch (error) {
//     await client.query('ROLLBACK');
//     res.status(400).json({ error: error.message });
//   } finally {
//     client.release();
//   }
// });

// // Keep other routes (GET, DELETE) as before

// module.exports = router;