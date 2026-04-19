const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { requireBoardMembership } = require('../middleware/boardAccess');

const router = express.Router();

function cardBoardId(req) {
  const row = db.prepare(`
    SELECT l.board_id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = ?
  `).get(req.params.cardId);
  return row ? row.board_id : null;
}
function commentBoardId(req) {
  const row = db.prepare(`
    SELECT l.board_id
    FROM comments cm
    JOIN cards c ON c.id = cm.card_id
    JOIN lists l ON l.id = c.list_id
    WHERE cm.id = ?
  `).get(req.params.commentId);
  return row ? row.board_id : null;
}

router.get('/cards/:cardId/comments',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    const rows = db.prepare(`
      SELECT cm.id, cm.body, cm.created_at, cm.user_id,
             u.name AS user_name, u.email AS user_email
      FROM comments cm JOIN users u ON u.id = cm.user_id
      WHERE cm.card_id = ?
      ORDER BY cm.created_at ASC
    `).all(req.params.cardId);
    res.json({ comments: rows });
  }
);

router.post('/cards/:cardId/comments',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    const { body } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'body required' });
    const info = db.prepare(
      'INSERT INTO comments (card_id, user_id, body) VALUES (?, ?, ?)'
    ).run(req.params.cardId, req.user.id, body.trim());
    const comment = db.prepare(`
      SELECT cm.id, cm.body, cm.created_at, cm.user_id,
             u.name AS user_name, u.email AS user_email
      FROM comments cm JOIN users u ON u.id = cm.user_id
      WHERE cm.id = ?
    `).get(info.lastInsertRowid);
    res.status(201).json({ comment });
  }
);

router.delete('/comments/:commentId',
  authRequired,
  requireBoardMembership(commentBoardId),
  (req, res) => {
    // Only the author can delete.
    const row = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(req.params.commentId);
    if (!row) return res.status(404).json({ error: 'not found' });
    if (row.user_id !== req.user.id) return res.status(403).json({ error: 'only author can delete' });
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
    res.json({ ok: true });
  }
);

module.exports = router;
