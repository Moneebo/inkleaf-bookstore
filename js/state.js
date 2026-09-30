export let state = {
  books: [],
  users: [],
  orders: [],
  cart: [],
  currentUser: null
};

export async function loadBooks() {
  const res = await fetch('https://inkleaf-bookstore-backend.onrender.com/api/books');
  state.books = await res.json();
}

export async function saveOrder(order) {
  const res = await fetch('https://inkleaf-bookstore-backend.onrender.com/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(order)
  });
  return res.json();
}