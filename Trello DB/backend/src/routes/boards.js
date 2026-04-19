const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { requireBoardMembership } = require('../middleware/boardAccess');
const { DEFAULT_LISTS } = require('../db/defaults');

const router = express.Router();

// Visibility rule: every logged-in user can see all boards
// (the user said "Once login everyone should be able to see whats happening").
// Membership is still tracked for assignment, but visibility is open.
router.get('/', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT b.id, b.name, b.description, b.created_by, b.created_at,
           u.name AS creator_name
    FROM boards b
    JOIN users u ON u.id = b.created_by
    ORDER BY b.created_at DESC
  `).all();
  res.json({ boards: rows });
});

router.post('/', authRequired, (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const tx = db.transaction(() => {
    const info = db.prepare(
      'INSERT INTO boards (name, description, created_by) VALUES (?, ?, ?)'
    ).run(name, description || null, req.user.id);

    const boardId = info.lastInsertRowid;

    db.prepare(
      'INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)'
    ).run(boardId, req.user.id, 'owner');

    const insertList = db.prepare(
      'INSERT INTO lists (board_id, name, position) VALUES (?, ?, ?)'
    );
    DEFAULT_LISTS.forEach((listName, idx) => {
      insertList.run(boardId, listName, idx);
    });

    return boardId;
  });

  const boardId = tx();
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);
  res.status(201).json({ board });
});

router.get('/:boardId',
  authRequired,
  requireBoardMembership(req => req.params.boardId),
  (req, res) => {
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.boardId);
    const lists = db.prepare(
      'SELECT id, name, position FROM lists WHERE board_id = ? ORDER BY position'
    ).all(req.boardId);

    const cards = db.prepare(`
      SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.position,
             c.created_by, c.created_at
      FROM cards c
      JOIN lists l ON l.id = c.list_id
      WHERE l.board_id = ?
      ORDER BY c.list_id, c.position
    `).all(req.boardId);

    const cardIds = cards.map(c => c.id);
    let assignees = [];
    let labels = [];
    if (cardIds.length > 0) {
      const placeholders = cardIds.map(() => '?').join(',');
      assignees = db.prepare(`
        SELECT ca.card_id, u.id, u.name, u.email
        FROM card_assignees ca JOIN users u ON u.id = ca.user_id
        WHERE ca.card_id IN (${placeholders})
      `).all(...cardIds);
      labels = db.prepare(`
        SELECT id, card_id, label, color
        FROM card_labels WHERE card_id IN (${placeholders})
      `).all(...cardIds);
    }

    const byCard = (id) => ({
      assignees: assignees.filter(a => a.card_id === id).map(a => ({ id: a.id, name: a.name, email: a.email })),
      labels: labels.filter(l => l.card_id === id).map(l => ({ id: l.id, label: l.label, color: l.color })),
    });

    const enrichedCards = cards.map(c => ({ ...c, ...byCard(c.id) }));

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, bm.role
      FROM board_members bm JOIN users u ON u.id = bm.user_id
      WHERE bm.board_id = ?
    `).all(req.boardId);

    res.json({ board, lists, cards: enrichedCards, members });
  }
);

router.patch('/:boardId',
  authRequired,
  requireBoardMembership(req => req.params.boardId),
  (req, res) => {
    const { name, description } = req.body || {};
    db.prepare(
      'UPDATE boards SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?'
    ).run(name ?? null, description ?? null, req.boardId);
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.boardId);
    res.json({ board });
  }
);

router.delete('/:boardId',
  authRequired,
  requireBoardMembership(req => req.params.boardId),
  (req, res) => {
    db.prepare('DELETE FROM boards WHERE id = ?').run(req.boardId);
    res.json({ ok: true });
  }
);

// Add a member to a board
router.post('/:boardId/members',
  authRequired,
  requireBoardMembership(req => req.params.boardId),
  (req, res) => {
    const { userId, email } = req.body || {};
    let user;
    if (userId) user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
    else if (email) user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'user not found' });

    db.prepare(
      'INSERT OR IGNORE INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)'
    ).run(req.boardId, user.id, 'member');

    res.status(201).json({ member: { ...user, role: 'member' } });
  }
);

router.delete('/:boardId/members/:userId',
  authRequired,
  requireBoardMembership(req => req.params.boardId),
  (req, res) => {
    db.prepare(
      'DELETE FROM board_members WHERE board_id = ? AND user_id = ?'
    ).run(req.boardId, req.params.userId);
    res.json({ ok: true });
  }
);

module.exports = router;
