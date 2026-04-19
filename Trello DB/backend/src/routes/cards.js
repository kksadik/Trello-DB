const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { requireBoardMembership } = require('../middleware/boardAccess');

const router = express.Router();

function listBoardId(req) {
  const row = db.prepare('SELECT board_id FROM lists WHERE id = ?').get(req.params.listId);
  return row ? row.board_id : null;
}
function cardBoardId(req) {
  const row = db.prepare(`
    SELECT l.board_id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = ?
  `).get(req.params.cardId);
  return row ? row.board_id : null;
}

function loadCard(cardId) {
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
  if (!card) return null;
  const assignees = db.prepare(`
    SELECT u.id, u.name, u.email
    FROM card_assignees ca JOIN users u ON u.id = ca.user_id
    WHERE ca.card_id = ?
  `).all(cardId);
  const labels = db.prepare(
    'SELECT id, label, color FROM card_labels WHERE card_id = ?'
  ).all(cardId);
  return { ...card, assignees, labels };
}

// POST /api/lists/:listId/cards
router.post('/lists/:listId/cards',
  authRequired,
  requireBoardMembership(listBoardId),
  (req, res) => {
    const { title, description, due_date, assigneeIds, labels } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const max = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM cards WHERE list_id = ?')
      .get(req.params.listId).m;

    const tx = db.transaction(() => {
      const info = db.prepare(
        'INSERT INTO cards (list_id, title, description, due_date, position, created_by) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(req.params.listId, title, description || null, due_date || null, max + 1, req.user.id);

      const cardId = info.lastInsertRowid;

      if (Array.isArray(assigneeIds)) {
        const ins = db.prepare('INSERT OR IGNORE INTO card_assignees (card_id, user_id) VALUES (?, ?)');
        assigneeIds.forEach(uid => ins.run(cardId, uid));
      }
      if (Array.isArray(labels)) {
        const insL = db.prepare('INSERT INTO card_labels (card_id, label, color) VALUES (?, ?, ?)');
        labels.forEach(l => {
          if (typeof l === 'string') insL.run(cardId, l, null);
          else insL.run(cardId, l.label, l.color || null);
        });
      }
      return cardId;
    });

    const cardId = tx();
    res.status(201).json({ card: loadCard(cardId) });
  }
);

// GET /api/cards/:cardId
router.get('/cards/:cardId',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    const card = loadCard(req.params.cardId);
    if (!card) return res.status(404).json({ error: 'not found' });
    res.json({ card });
  }
);

// PATCH /api/cards/:cardId  — title/desc/due/list_id/position
router.patch('/cards/:cardId',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    const { title, description, due_date, list_id, position } = req.body || {};

    // If moving to another list, ensure that list belongs to the same board.
    if (list_id) {
      const ok = db.prepare('SELECT 1 FROM lists WHERE id = ? AND board_id = ?')
        .get(list_id, req.boardId);
      if (!ok) return res.status(400).json({ error: 'target list not in this board' });
    }

    db.prepare(`
      UPDATE cards SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        due_date = COALESCE(?, due_date),
        list_id = COALESCE(?, list_id),
        position = COALESCE(?, position)
      WHERE id = ?
    `).run(
      title ?? null,
      description ?? null,
      due_date ?? null,
      list_id ?? null,
      position ?? null,
      req.params.cardId
    );

    res.json({ card: loadCard(req.params.cardId) });
  }
);

// DELETE /api/cards/:cardId
router.delete('/cards/:cardId',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.cardId);
    res.json({ ok: true });
  }
);

// Assignees
router.post('/cards/:cardId/assignees',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });
    db.prepare('INSERT OR IGNORE INTO card_assignees (card_id, user_id) VALUES (?, ?)')
      .run(req.params.cardId, userId);
    res.json({ card: loadCard(req.params.cardId) });
  }
);
router.delete('/cards/:cardId/assignees/:userId',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    db.prepare('DELETE FROM card_assignees WHERE card_id = ? AND user_id = ?')
      .run(req.params.cardId, req.params.userId);
    res.json({ card: loadCard(req.params.cardId) });
  }
);

// Labels
router.post('/cards/:cardId/labels',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    const { label, color } = req.body || {};
    if (!label) return res.status(400).json({ error: 'label required' });
    db.prepare('INSERT INTO card_labels (card_id, label, color) VALUES (?, ?, ?)')
      .run(req.params.cardId, label, color || null);
    res.json({ card: loadCard(req.params.cardId) });
  }
);
router.delete('/cards/:cardId/labels/:labelId',
  authRequired,
  requireBoardMembership(cardBoardId),
  (req, res) => {
    db.prepare('DELETE FROM card_labels WHERE id = ? AND card_id = ?')
      .run(req.params.labelId, req.params.cardId);
    res.json({ card: loadCard(req.params.cardId) });
  }
);

module.exports = router;
