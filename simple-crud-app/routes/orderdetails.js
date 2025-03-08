// //routes/orderdetails.js
// const express = require('express');
// const router = express.Router();
// const pool = require('../db');

// // Get all order details with book and order information
// router.get('/', async (req, res) => {
//   try {
//     const { order_id, book_id } = req.query;
//     let query = `
//       SELECT od.*, 
//              b.title AS book_title, 
//              b.isbn, 
//              o.order_date, 
//              o.status AS order_status,
//              c.first_name || ' ' || c.last_name AS customer_name
//       FROM OrderDetails od
//       JOIN Books b ON od.book_id = b.book_id
//       JOIN Orders o ON od.order_id = o.order_id
//       JOIN Customers c ON o.customer_id = c.customer_id
//       WHERE 1=1
//     `;
//     const params = [];
    
//     if (order_id) {
//       query += ` AND od.order_id = $${params.length + 1}`;
//       params.push(order_id);
//     }
    
//     if (book_id) {
//       query += ` AND od.book_id = $${params.length + 1}`;
//       params.push(book_id);
//     }
    
//     query += ' ORDER BY o.order_date DESC, od.order_id';
    
//     const { rows } = await pool.query(query, params);
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Get order details by order_id and book_id
// router.get('/:order_id/:book_id', async (req, res) => {
//   try {
//     const { rows } = await pool.query(`
//       SELECT od.*, 
//              b.title AS book_title, 
//              b.isbn,
//              o.order_date, 
//              o.status AS order_status,
//              c.first_name || ' ' || c.last_name AS customer_name
//       FROM OrderDetails od
//       JOIN Books b ON od.book_id = b.book_id
//       JOIN Orders o ON od.order_id = o.order_id
//       JOIN Customers c ON o.customer_id = c.customer_id
//       WHERE od.order_id = $1 AND od.book_id = $2
//     `, [req.params.order_id, req.params.book_id]);

//     if (rows.length === 0) {
//       return res.status(404).json({ error: 'Order detail not found' });
//     }
//     res.json(rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Create new order detail
// router.post('/', async (req, res) => {
//   try {
//     const { 
//       order_id,
//       book_id,
//       quantity,
//       unit_price
//     } = req.body;

//     // Validation
//     if (!order_id || !book_id || !quantity) {
//       return res.status(400).json({ error: 'Order ID, book ID, and quantity are required' });
//     }

//     if (quantity <= 0) {
//       return res.status(400).json({ error: 'Quantity must be positive' });
//     }

//     // Check if order exists
//     const orderCheck = await pool.query(
//       'SELECT order_id FROM Orders WHERE order_id = $1',
//       [order_id]
//     );
//     if (orderCheck.rows.length === 0) {
//       return res.status(400).json({ error: 'Invalid order_id' });
//     }

//     // Check if book exists and has enough stock
//     const bookCheck = await pool.query(
//       'SELECT book_id, price, stock_quantity FROM Books WHERE book_id = $1',
//       [book_id]
//     );
//     if (bookCheck.rows.length === 0) {
//       return res.status(400).json({ error: 'Invalid book_id' });
//     }

//     if (bookCheck.rows[0].stock_quantity < quantity) {
//       return res.status(400).json({ error: 'Not enough stock available' });
//     }

//     // If unit_price is not provided, use the book's current price
//     // const finalUnitPrice = unit_price || bookCheck.rows[0].price;
//     const finalUnitPrice = unit_price ? Number(unit_price) : Number(bookCheck.rows[0].price);

//     // Begin transaction
//     const client = await pool.connect();
//     try {
//       await client.query('BEGIN');
      
//       // Insert order detail
//       const { rows } = await client.query(
//         `INSERT INTO OrderDetails (
//           order_id, book_id, quantity, unit_price
//         ) VALUES ($1, $2, $3, $4)
//         RETURNING *`,
//         [order_id, book_id, quantity, finalUnitPrice]
//       );

//       // Update book stock
//       await client.query(
//         'UPDATE Books SET stock_quantity = stock_quantity - $1 WHERE book_id = $2',
//         [quantity, book_id]
//       );

//       // Update order total amount
//     //   await client.query(
//     //     'UPDATE Orders SET total_amount = COALESCE(total_amount, 0) + ($1 * $2) WHERE order_id = $3',
//     //     [finalUnitPrice, quantity, order_id]
//     //   );

//     // In the POST route


// // And when updating the order total
// await client.query(
//   'UPDATE Orders SET total_amount = COALESCE(total_amount, 0) + ($1 * $2) WHERE order_id = $3',
//   [Number(finalUnitPrice), Number(quantity), order_id]
// );

//       await client.query('COMMIT');
//       res.status(201).json(rows[0]);
//     } catch (err) {
//       await client.query('ROLLBACK');
//       throw err;
//     } finally {
//       client.release();
//     }
//   } catch (err) {
//     if (err.code === '23505') {
//       return res.status(409).json({ error: 'This book is already in the order' });
//     }
//     if (err.code === '23503') {
//       return res.status(400).json({ error: 'Invalid order or book ID' });
//     }
//     res.status(500).json({ error: err.message });
//   }
// });

// // Update order detail
// router.put('/:order_id/:book_id', async (req, res) => {
//   try {
//     const { quantity, unit_price } = req.body;
//     const { order_id, book_id } = req.params;

//     if (!quantity && unit_price === undefined) {
//       return res.status(400).json({ error: 'No valid fields provided for update' });
//     }

//     // Begin transaction
//     const client = await pool.connect();
//     try {
//       await client.query('BEGIN');
      
//       // Get current order detail
//       const currentDetail = await client.query(
//         'SELECT quantity, unit_price FROM OrderDetails WHERE order_id = $1 AND book_id = $2',
//         [order_id, book_id]
//       );
      
//       if (currentDetail.rows.length === 0) {
//         await client.query('ROLLBACK');
//         return res.status(404).json({ error: 'Order detail not found' });
//       }
      
//       const currentQuantity = currentDetail.rows[0].quantity;
//       const currentUnitPrice = currentDetail.rows[0].unit_price;
      
//       // If quantity is changing, check stock and update book inventory
//       if (quantity && quantity !== currentQuantity) {
//         if (quantity <= 0) {
//           await client.query('ROLLBACK');
//           return res.status(400).json({ error: 'Quantity must be positive' });
//         }
        
//         // Get book stock
//         const bookCheck = await client.query(
//           'SELECT stock_quantity FROM Books WHERE book_id = $1',
//           [book_id]
//         );
        
//         const availableStock = bookCheck.rows[0].stock_quantity + currentQuantity;
//         if (availableStock < quantity) {
//           await client.query('ROLLBACK');
//           return res.status(400).json({ error: 'Not enough stock available' });
//         }
        
//         // Update book stock
//         await client.query(
//           'UPDATE Books SET stock_quantity = stock_quantity + $1 - $2 WHERE book_id = $3',
//           [currentQuantity, quantity, book_id]
//         );
//       }
      
//       // Update order detail
//       const updateParams = [];
//       const updates = [];
//       let paramCount = 1;
      
//       if (quantity) {
//         updates.push(`quantity = $${paramCount++}`);
//         updateParams.push(quantity);
//       }
      
//       if (unit_price !== undefined) {
//         updates.push(`unit_price = $${paramCount++}`);
//         updateParams.push(unit_price);
//       }
      
//       updateParams.push(order_id, book_id);
      
//       const { rows } = await client.query(
//         `UPDATE OrderDetails
//          SET ${updates.join(', ')}
//          WHERE order_id = $${paramCount++} AND book_id = $${paramCount}
//          RETURNING *`,
//         updateParams
//       );
      
//       // Update order total amount
//       // Update these lines in your PUT route
// const newQuantity = quantity ? Number(quantity) : Number(currentQuantity);
// const newUnitPrice = unit_price !== undefined ? Number(unit_price) : Number(currentUnitPrice);
// const priceDifference = (newQuantity * newUnitPrice) - (Number(currentQuantity) * Number(currentUnitPrice));
//       await client.query(
//         'UPDATE Orders SET total_amount = total_amount + $1 WHERE order_id = $2',
//         [priceDifference, order_id]
//       );
      
//       await client.query('COMMIT');
//       res.json(rows[0]);
//     } catch (err) {
//       await client.query('ROLLBACK');
//       throw err;
//     } finally {
//       client.release();
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Delete order detail
// router.delete('/:order_id/:book_id', async (req, res) => {
//   try {
//     const { order_id, book_id } = req.params;
    
//     // Begin transaction
//     const client = await pool.connect();
//     try {
//       await client.query('BEGIN');
      
//       // Get current order detail
//       const currentDetail = await client.query(
//         'SELECT quantity, unit_price FROM OrderDetails WHERE order_id = $1 AND book_id = $2',
//         [order_id, book_id]
//       );
      
//       if (currentDetail.rows.length === 0) {
//         await client.query('ROLLBACK');
//         return res.status(404).json({ error: 'Order detail not found' });
//       }
      
//       const { quantity, unit_price } = currentDetail.rows[0];
      
//       // Delete the order detail
//       await client.query(
//         'DELETE FROM OrderDetails WHERE order_id = $1 AND book_id = $2',
//         [order_id, book_id]
//       );
      
//       // Return book to inventory
//       await client.query(
//         'UPDATE Books SET stock_quantity = stock_quantity + $1 WHERE book_id = $2',
//         [quantity, book_id]
//       );
      
//       // Update order total amount
//     //   await client.query(
//     //     'UPDATE Orders SET total_amount = total_amount - $1 WHERE order_id = $2',
//     //     [quantity * unit_price, order_id]
//     //   );

//     // In the DELETE route
// await client.query(
//     'UPDATE Orders SET total_amount = total_amount - $1 WHERE order_id = $2',
//     [Number(quantity) * Number(unit_price), order_id]
//   );
      
//       await client.query('COMMIT');
//       res.status(204).end();
//     } catch (err) {
//       await client.query('ROLLBACK');
//       throw err;
//     } finally {
//       client.release();
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

// routes/orderDetailsRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assuming you have a db connection file

// Get all order details
// routes/orderDetailsRoutes.js - Update GET endpoints
// router.get('/', async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT 
//         od.*,
//         b.title AS book_title,
//         b.isbn,
//         o.order_date,
//         o.status AS order_status,
//         c.name AS customer_name
//       FROM OrderDetails od
//       JOIN Books b ON od.book_id = b.book_id
//       JOIN Orders o ON od.order_id = o.order_id
//       JOIN Customers c ON o.customer_id = c.customer_id
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


router.get('/', async (req, res) => {
  try {
    const { order_id, book_id } = req.query;
    let query = `
      SELECT od.*, 
             b.title AS book_title, 
             b.isbn, 
             o.order_date, 
             o.status AS order_status,
             c.first_name || ' ' || c.last_name AS customer_name
      FROM OrderDetails od
      JOIN Books b ON od.book_id = b.book_id
      JOIN Orders o ON od.order_id = o.order_id
      JOIN Customers c ON o.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];
    
    if (order_id) {
      query += ` AND od.order_id = $${params.length + 1}`;
      params.push(order_id);
    }
    
    if (book_id) {
      query += ` AND od.book_id = $${params.length + 1}`;
      params.push(book_id);
    }
    
    query += ' ORDER BY o.order_date DESC, od.order_id';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get order details by order ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await pool.query(
      'SELECT * FROM OrderDetails WHERE order_id = $1',
      [orderId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order details by book ID
router.get('/book/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const result = await pool.query(
      'SELECT * FROM OrderDetails WHERE book_id = $1',
      [bookId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific order detail by composite key
router.get('/:orderId/:bookId', async (req, res) => {
  try {
    const { orderId, bookId } = req.params;
    const result = await pool.query(
      'SELECT * FROM OrderDetails WHERE order_id = $1 AND book_id = $2',
      [orderId, bookId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order detail not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new order detail
router.post('/', async (req, res) => {
  try {
    const { order_id, book_id, quantity, unit_price } = req.body;
    
    // Validate required fields
    if (!order_id || !book_id || !quantity || !unit_price) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO OrderDetails (order_id, book_id, quantity, unit_price) VALUES ($1, $2, $3, $4) RETURNING *',
      [order_id, book_id, quantity, unit_price]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'This order detail already exists' });
    }
    if (err.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Invalid order_id or book_id' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order detail
router.put('/:orderId/:bookId', async (req, res) => {
  try {
    const { orderId, bookId } = req.params;
    const { quantity, unit_price } = req.body;
    
    // Validate required fields
    if (!quantity || !unit_price) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const result = await pool.query(
      'UPDATE OrderDetails SET quantity = $1, unit_price = $2 WHERE order_id = $3 AND book_id = $4 RETURNING *',
      [quantity, unit_price, orderId, bookId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order detail not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order detail
router.delete('/:orderId/:bookId', async (req, res) => {
  try {
    const { orderId, bookId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM OrderDetails WHERE order_id = $1 AND book_id = $2 RETURNING *',
      [orderId, bookId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order detail not found' });
    }
    
    res.json({ message: 'Order detail deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// Add this to your main app.js or index.js file
// app.use('/api/orderdetails', require('./routes/orderDetailsRoutes'));