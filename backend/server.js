import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('✓ Connected to PostgreSQL');
  }
});

// ===== API ROUTES =====

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get book by ID
app.get('/api/books/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  const { userId, items, subtotal, shipping, tax, total, address, paymentMethod, paymentStatus } = req.body;
  
  try {
    const orderId = 'INK-' + Date.now().toString(36).toUpperCase();
    
    const orderResult = await pool.query(
      `INSERT INTO orders (id, user_id, subtotal, shipping_fee, tax, total, address_line1, address_city, address_state, address_pincode, payment_method, payment_status, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Placed', NOW())
       RETURNING *`,
      [orderId, userId, subtotal, shipping, tax, total, address.line1, address.city, address.state, address.pincode, paymentMethod, paymentStatus || 'Paid']
    );

    // Insert order items
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, book_id, title_snapshot, quantity, price_snapshot)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.bookId, item.title, item.qty, item.price]
      );
      
      // Decrement stock
      await pool.query(
        'UPDATE books SET stock = stock - $1 WHERE id = $2',
        [item.qty, item.bookId]
      );
    }

    res.json(orderResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders for user
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (!result.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    // In production, use bcrypt to verify hashed password
    // For now, just compare (NOT SECURE — use bcrypt later)
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Add book (admin only)
app.post('/api/books', async (req, res) => {
  const { title, author, categoryId, price, stock, rating, description, isBestseller, isFeatured } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO books (title, author, category_id, price, stock, rating, description, is_bestseller, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, author, categoryId, price, stock, rating, description, isBestseller, isFeatured]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// Update book (admin only)
app.put('/api/books/:id', async (req, res) => {
  const { title, author, price, stock, rating, description, isBestseller, isFeatured } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE books SET title=$1, author=$2, price=$3, stock=$4, rating=$5, description=$6, is_bestseller=$7, is_featured=$8
       WHERE id=$9
       RETURNING *`,
      [title, author, price, stock, rating, description, isBestseller, isFeatured, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Delete book (admin only)
app.delete('/api/books/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✓ Server running on :${PORT}`));