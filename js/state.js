export let state = {
  books: [],
  users: [],
  orders: [],
  cart: [],
  currentUser: null
};

export async function loadBooks() {
  const res = await fetch('http://localhost:3000/api/books');
  state.books = await res.json();
}

export async function saveOrder(order) {
  const res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(order)
  });
  return res.json();
}