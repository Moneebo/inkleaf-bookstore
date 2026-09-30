import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (same as before, but now in the server)
let books = [
  { id: 'b1', title: 'Silent Orchard', author: 'Meera Kulkarni', price: 399, stock: 24 },
  // ... rest of seed books
];

let orders = [];

app.get('/api/books', (req, res) => {
  res.json(books);
});

app.post('/api/orders', (req, res) => {
  const order = { id: 'INK-' + Date.now(), ...req.body, createdAt: new Date().toISOString() };
  orders.push(order);
  res.json(order);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.listen(3000, () => console.log('Backend on :3000'));