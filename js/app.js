import { state, loadBooks } from './state.js';
import { renderHome, navigate } from './pages.js';
import { initChat } from './chat.js';

export async function initApp() {
  await loadBooks();
  initChat();
  renderHome();
}