const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// List all users (for assigning to cards / inviting to boards).
router.get('/', authRequired, (req, res) => {
  const q = (req.query.q || '').toString().trim();
  let rows;
  if (q) {
    rows = db.prepare(
      'SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY name'
    ).all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare('SELECT id, name, email FROM users ORDER BY name').all();
  }
  res.json({ users: rows });
});

module.exports = router;
