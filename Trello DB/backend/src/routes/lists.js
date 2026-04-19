const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { requireBoardMembership } = require('../middleware/boardAccess');

const router = express.Router();

function listBoardId(req) {
  const row = db.prepare('SELECT board_id FROM lists WHERE id = ?').get(req.params.listId);
  return row ? row.board_id : null;
}

// POST /api/boards/:boardId/lists
router.post('/boards/:boardId/lists',
  authRequired,
  requireBoardMembership(req => req.params.boardId),
  (req, res) => {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const max = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM lists WHERE board_id = ?')
      .get(req.boardId).m;

    const info = db.prepare(
      'INSERT INTO lists (board_id, name, position) VALUES (?, ?, ?)'
    ).run(req.boardId, name, max + 1);

    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ list });
  }
);

// PATCH /api/lists/:listId
router.patch('/lists/:listId',
  authRequired,
  requireBoardMembership(listBoardId),
  (req, res) => {
    const { name, position } = req.body || {};
    db.prepare(
      'UPDATE lists SET name = COALESCE(?, name), position = COALESCE(?, position) WHERE id = ?'
    ).run(name ?? null, position ?? null, req.params.listId);
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.listId);
    res.json({ list });
  }
);

// DELETE /api/lists/:listId
router.delete('/lists/:listId',
  authRequired,
  requireBoardMembership(listBoardId),
  (req, res) => {
    db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.listId);
    res.json({ ok: true });
  }
);

module.exports = router;
