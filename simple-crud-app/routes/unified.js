const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all orders with customer details and optional filtering
router.get('/', async (req, res) => {
  try {
    const { customer_id, status, start_date, end_date } = req.query;
    let query = `
      SELECT o.*, c.first_name, c.last_name, c.email 
      FROM Orders o
      JOIN Customers c ON o.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (customer_id) {
      query += ` AND o.customer_id = $${paramCount++}`;
      params.push(customer_id);
    }
    
    if (status) {
      query += ` AND o.status = $${paramCount++}`;
      params.push(status);
    }
    
    if (start_date) {
      query += ` AND o.order_date >= $${paramCount++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND o.order_date <= $${paramCount++}`;
      params.push(end_date);
    }
    
    query += ' ORDER BY o.order_date DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single order with all its details including items
router.get('/:id', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get order with customer details
      const orderResult = await client.query(`
        SELECT o.*, c.first_name, c.last_name, c.email 
        FROM Orders o
        JOIN Customers c ON o.customer_id = c.customer_id
        WHERE order_id = $1
      `, [req.params.id]);
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const order = orderResult.rows[0];
      
      // Get order items
      const itemsResult = await client.query(`
        SELECT od.*, 
               b.title AS book_title, 
               b.isbn,
               b.author,
               b.price AS current_price
        FROM OrderDetails od
        JOIN Books b ON od.book_id = b.book_id
        WHERE od.order_id = $1
        ORDER BY od.book_id
      `, [req.params.id]);
      
      // Combine data
      order.items = itemsResult.rows;
      res.json(order);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Create a new order with items in a single transaction
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { customer_id, items, status = 'Pending' } = req.body;
    
    // Validation
    if (!customer_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Missing required field: customer_id' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }
    
    // Check customer exists
    const customerCheck = await client.query(
      'SELECT customer_id FROM Customers WHERE customer_id = $1',
      [customer_id]
    );
    
    if (customerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Validate items and check stock
    let totalAmount = 0;
    for (const item of items) {
      if (!item.book_id || !item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Each item must have book_id and quantity' });
      }
      
      if (item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Quantity must be positive' });
      }
      
      // Check book exists and get price
      const bookCheck = await client.query(
        'SELECT book_id, price, stock_quantity FROM Books WHERE book_id = $1',
        [item.book_id]
      );
      
      if (bookCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Book with ID ${item.book_id} not found` });
      }
      
      if (bookCheck.rows[0].stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Not enough stock for book ID ${item.book_id}`,
          requested: item.quantity,
          available: bookCheck.rows[0].stock_quantity
        });
      }
      
      // Use provided unit_price or book's current price
      const unitPrice = item.unit_price || bookCheck.rows[0].price;
      totalAmount += unitPrice * item.quantity;
    }
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO Orders 
       (customer_id, total_amount, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [customer_id, totalAmount, status]
    );
    
    const newOrder = orderResult.rows[0];
    const orderItems = [];
    
    // Add items to order
    for (const item of items) {
      const bookCheck = await client.query(
        'SELECT price FROM Books WHERE book_id = $1',
        [item.book_id]
      );
      
      const unitPrice = item.unit_price || bookCheck.rows[0].price;
      
      // Insert order detail
      const detailResult = await client.query(
        `INSERT INTO OrderDetails (
          order_id, book_id, quantity, unit_price
        ) VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [newOrder.order_id, item.book_id, item.quantity, unitPrice]
      );
      
      // Update book stock
      await client.query(
        'UPDATE Books SET stock_quantity = stock_quantity - $1 WHERE book_id = $2',
        [item.quantity, item.book_id]
      );
      
      // Get book details
      const bookResult = await client.query(
        'SELECT title, isbn FROM Books WHERE book_id = $1',
        [item.book_id]
      );
      
      // Combine order detail with book information
      const orderItem = {
        ...detailResult.rows[0],
        book_title: bookResult.rows[0].title,
        isbn: bookResult.rows[0].isbn
      };
      
      orderItems.push(orderItem);
    }
    
    await client.query('COMMIT');
    
    // Return complete order with items
    newOrder.items = orderItems;
    res.status(201).json(newOrder);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid customer_id or book_id' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT - Update order status or customer
router.put('/:id', async (req, res) => {
  try {
    const { status, customer_id } = req.body;
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
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Remove an order and all its items
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if order exists
    const orderCheck = await client.query(
      'SELECT order_id FROM Orders WHERE order_id = $1',
      [req.params.id]
    );
    
    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items to update inventory
    const items = await client.query(
      'SELECT book_id, quantity FROM OrderDetails WHERE order_id = $1',
      [req.params.id]
    );
    
    // Return items to inventory
    for (const item of items.rows) {
      await client.query(
        'UPDATE Books SET stock_quantity = stock_quantity + $1 WHERE book_id = $2',
        [item.quantity, item.book_id]
      );
    }
    
    // Delete order details first (due to foreign key constraint)
    await client.query(
      'DELETE FROM OrderDetails WHERE order_id = $1',
      [req.params.id]
    );
    
    // Delete the order
    await client.query(
      'DELETE FROM Orders WHERE order_id = $1',
      [req.params.id]
    );
    
    await client.query('COMMIT');
    res.status(204).end();
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST - Add item to an existing order
router.post('/:id/items', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { book_id, quantity, unit_price } = req.body;
    const order_id = req.params.id;
    
    // Validation
    if (!book_id || !quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Book ID and quantity are required' });
    }
    
    if (quantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Quantity must be positive' });
    }
    
    // Check if order exists
    const orderCheck = await client.query(
      'SELECT order_id FROM Orders WHERE order_id = $1',
      [order_id]
    );
    
    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if book exists and has enough stock
    const bookCheck = await client.query(
      'SELECT book_id, price, stock_quantity FROM Books WHERE book_id = $1',
      [book_id]
    );
    
    if (bookCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (bookCheck.rows[0].stock_quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Not enough stock available',
        requested: quantity,
        available: bookCheck.rows[0].stock_quantity
      });
    }
    
    // Check if item already exists in order
    const existingItem = await client.query(
      'SELECT * FROM OrderDetails WHERE order_id = $1 AND book_id = $2',
      [order_id, book_id]
    );
    
    if (existingItem.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'This book is already in the order',
        suggestion: 'Use PUT /orders/{id}/items/{book_id} to update quantity'
      });
    }
    
    // If unit_price is not provided, use the book's current price
    const finalUnitPrice = unit_price || bookCheck.rows[0].price;
    
    // Insert order detail
    const { rows } = await client.query(
      `INSERT INTO OrderDetails (
        order_id, book_id, quantity, unit_price
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [order_id, book_id, quantity, finalUnitPrice]
    );
    
    // Update book stock
    await client.query(
      'UPDATE Books SET stock_quantity = stock_quantity - $1 WHERE book_id = $2',
      [quantity, book_id]
    );
    
    // Update order total amount
    await client.query(
      'UPDATE Orders SET total_amount = COALESCE(total_amount, 0) + ($1 * $2) WHERE order_id = $3',
      [finalUnitPrice, quantity, order_id]
    );
    
    await client.query('COMMIT');
    
    // Get book details to include in response
    const bookResult = await pool.query(
      'SELECT title, isbn FROM Books WHERE book_id = $1',
      [book_id]
    );
    
    const result = {
      ...rows[0],
      book_title: bookResult.rows[0].title,
      isbn: bookResult.rows[0].isbn
    };
    
    res.status(201).json(result);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This book is already in the order' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid order or book ID' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT - Update an item in an order
router.put('/:id/items/:book_id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { quantity, unit_price } = req.body;
    const { id: order_id, book_id } = req.params;
    
    if (!quantity && unit_price === undefined) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }
    
    // Get current order detail
    const currentDetail = await client.query(
      'SELECT quantity, unit_price FROM OrderDetails WHERE order_id = $1 AND book_id = $2',
      [order_id, book_id]
    );
    
    if (currentDetail.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found in order' });
    }
    
    const currentQuantity = currentDetail.rows[0].quantity;
    const currentUnitPrice = currentDetail.rows[0].unit_price;
    
    // If quantity is changing, check stock and update book inventory
    if (quantity && quantity !== currentQuantity) {
      if (quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Quantity must be positive' });
      }
      
      // Get book stock
      const bookCheck = await client.query(
        'SELECT stock_quantity FROM Books WHERE book_id = $1',
        [book_id]
      );
      
      const availableStock = bookCheck.rows[0].stock_quantity + currentQuantity;
      if (availableStock < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Not enough stock available',
          requested: quantity,
          available: availableStock
        });
      }
      
      // Update book stock
      await client.query(
        'UPDATE Books SET stock_quantity = stock_quantity + $1 - $2 WHERE book_id = $3',
        [currentQuantity, quantity, book_id]
      );
    }
    
    // Update order detail
    const updateParams = [];
    const updates = [];
    let paramCount = 1;
    
    if (quantity) {
      updates.push(`quantity = $${paramCount++}`);
      updateParams.push(quantity);
    }
    
    if (unit_price !== undefined) {
      updates.push(`unit_price = $${paramCount++}`);
      updateParams.push(unit_price);
    }
    
    updateParams.push(order_id, book_id);
    
    const { rows } = await client.query(
      `UPDATE OrderDetails
       SET ${updates.join(', ')}
       WHERE order_id = $${paramCount++} AND book_id = $${paramCount}
       RETURNING *`,
      updateParams
    );
    
    // Update order total amount
    const newQuantity = quantity || currentQuantity;
    const newUnitPrice = unit_price !== undefined ? unit_price : currentUnitPrice;
    const priceDifference = (newQuantity * newUnitPrice) - (currentQuantity * currentUnitPrice);
    
    await client.query(
      'UPDATE Orders SET total_amount = total_amount + $1 WHERE order_id = $2',
      [priceDifference, order_id]
    );
    
    await client.query('COMMIT');
    
    // Get book details to include in response
    const bookResult = await pool.query(
      'SELECT title, isbn FROM Books WHERE book_id = $1',
      [book_id]
    );
    
    const result = {
      ...rows[0],
      book_title: bookResult.rows[0].title,
      isbn: bookResult.rows[0].isbn
    };
    
    res.json(result);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE - Remove an item from an order
router.delete('/:id/items/:book_id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id: order_id, book_id } = req.params;
    
    // Get current order detail
    const currentDetail = await client.query(
      'SELECT quantity, unit_price FROM OrderDetails WHERE order_id = $1 AND book_id = $2',
      [order_id, book_id]
    );
    
    if (currentDetail.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found in order' });
    }
    
    const { quantity, unit_price } = currentDetail.rows[0];
    
    // Delete the order detail
    await client.query(
      'DELETE FROM OrderDetails WHERE order_id = $1 AND book_id = $2',
      [order_id, book_id]
    );
    
    // Return book to inventory
    await client.query(
      'UPDATE Books SET stock_quantity = stock_quantity + $1 WHERE book_id = $2',
      [quantity, book_id]
    );
    
    // Update order total amount
    await client.query(
      'UPDATE Orders SET total_amount = total_amount - $1 WHERE order_id = $2',
      [quantity * unit_price, order_id]
    );
    
    await client.query('COMMIT');
    res.status(204).end();
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;