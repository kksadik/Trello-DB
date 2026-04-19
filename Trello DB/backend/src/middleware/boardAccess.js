const db = require('../db');

// Ensures the authenticated user is a member of (or creator of) the given board.
// Accepts boardId either from req.params.boardId OR resolved from a list/card.
function requireBoardMembership(getBoardId) {
  return (req, res, next) => {
    const boardId = getBoardId(req);
    if (!boardId) return res.status(400).json({ error: 'Board not identified' });

    const row = db.prepare(`
      SELECT 1 FROM boards b
      LEFT JOIN board_members bm ON bm.board_id = b.id AND bm.user_id = ?
      WHERE b.id = ? AND (b.created_by = ? OR bm.user_id IS NOT NULL)
    `).get(req.user.id, boardId, req.user.id);

    if (!row) return res.status(403).json({ error: 'Not a member of this board' });
    req.boardId = Number(boardId);
    next();
  };
}

module.exports = { requireBoardMembership };
