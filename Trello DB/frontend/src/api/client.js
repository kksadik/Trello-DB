const TOKEN_KEY = 'tb_token';
const USER_KEY = 'tb_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // auth
  register: (name, email, password) => request('POST', '/auth/register', { name, email, password }),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),

  // users
  users: (q = '') => request('GET', `/users${q ? '?q=' + encodeURIComponent(q) : ''}`),

  // boards
  listBoards: () => request('GET', '/boards'),
  createBoard: (name, description) => request('POST', '/boards', { name, description }),
  getBoard: (id) => request('GET', `/boards/${id}`),
  updateBoard: (id, patch) => request('PATCH', `/boards/${id}`, patch),
  deleteBoard: (id) => request('DELETE', `/boards/${id}`),
  addMember: (boardId, payload) => request('POST', `/boards/${boardId}/members`, payload),

  // lists
  createList: (boardId, name) => request('POST', `/boards/${boardId}/lists`, { name }),
  updateList: (listId, patch) => request('PATCH', `/lists/${listId}`, patch),
  deleteList: (listId) => request('DELETE', `/lists/${listId}`),

  // cards
  createCard: (listId, payload) => request('POST', `/lists/${listId}/cards`, payload),
  getCard: (cardId) => request('GET', `/cards/${cardId}`),
  updateCard: (cardId, patch) => request('PATCH', `/cards/${cardId}`, patch),
  deleteCard: (cardId) => request('DELETE', `/cards/${cardId}`),
  addAssignee: (cardId, userId) => request('POST', `/cards/${cardId}/assignees`, { userId }),
  removeAssignee: (cardId, userId) => request('DELETE', `/cards/${cardId}/assignees/${userId}`),
  addLabel: (cardId, label, color) => request('POST', `/cards/${cardId}/labels`, { label, color }),
  removeLabel: (cardId, labelId) => request('DELETE', `/cards/${cardId}/labels/${labelId}`),

  // comments
  listComments: (cardId) => request('GET', `/cards/${cardId}/comments`),
  addComment: (cardId, body) => request('POST', `/cards/${cardId}/comments`, { body }),
  deleteComment: (commentId) => request('DELETE', `/comments/${commentId}`),
};
