import React, { useEffect, useState } from 'react';
import { api, getUser } from '../api/client.js';

export default function CardModal({ cardId, allUsers, lists, onClose }) {
  const [card, setCard] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [labelText, setLabelText] = useState('');
  const [labelColor, setLabelColor] = useState('#61bd4f');
  const [err, setErr] = useState('');
  const me = getUser();

  async function load() {
    const [{ card }, { comments }] = await Promise.all([
      api.getCard(cardId),
      api.listComments(cardId),
    ]);
    setCard(card);
    setComments(comments);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cardId]);

  async function save(patch) {
    try {
      const { card } = await api.updateCard(cardId, patch);
      setCard(card);
    } catch (e) { setErr(e.message); }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    await api.addComment(cardId, newComment.trim());
    setNewComment('');
    load();
  }

  async function toggleAssignee(userId) {
    if (card.assignees.find(a => a.id === userId)) {
      await api.removeAssignee(cardId, userId);
    } else {
      await api.addAssignee(cardId, userId);
    }
    load();
  }

  async function addLabel(e) {
    e.preventDefault();
    if (!labelText.trim()) return;
    await api.addLabel(cardId, labelText.trim(), labelColor);
    setLabelText('');
    load();
  }

  async function removeLabel(labelId) {
    await api.removeLabel(cardId, labelId);
    load();
  }

  async function deleteCard() {
    if (!confirm('Delete this card?')) return;
    await api.deleteCard(cardId);
    onClose();
  }

  if (!card) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <input
          style={{ fontSize: 20, fontWeight: 600 }}
          defaultValue={card.title}
          onBlur={(e) => e.target.value !== card.title && save({ title: e.target.value })}
        />

        <div className="section-title">Status (column)</div>
        <select
          value={card.list_id}
          onChange={(e) => save({ list_id: Number(e.target.value) })}
        >
          {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <div className="section-title">Description</div>
        <textarea
          defaultValue={card.description || ''}
          placeholder="Add a description…"
          onBlur={(e) => e.target.value !== (card.description || '') && save({ description: e.target.value })}
        />

        <div className="section-title">Due date</div>
        <input
          type="date"
          defaultValue={card.due_date ? card.due_date.slice(0, 10) : ''}
          onChange={(e) => save({ due_date: e.target.value || null })}
        />

        <div className="section-title">Assignees</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {allUsers.map(u => {
            const on = card.assignees.find(a => a.id === u.id);
            return (
              <button
                key={u.id}
                className={on ? '' : 'ghost'}
                style={{ background: on ? '#0079bf' : '#dfe1e6', color: on ? 'white' : '#172b4d' }}
                onClick={() => toggleAssignee(u.id)}
                type="button"
              >
                {u.name}
              </button>
            );
          })}
        </div>

        <div className="section-title">Labels</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {card.labels.map(lab => (
            <span
              key={lab.id}
              className="label-chip"
              style={lab.color ? { background: lab.color, color: 'white' } : null}
            >
              {lab.label}{' '}
              <a
                href="#"
                style={{ marginLeft: 4, color: 'inherit' }}
                onClick={(e) => { e.preventDefault(); removeLabel(lab.id); }}
              >×</a>
            </span>
          ))}
        </div>
        <form onSubmit={addLabel} className="row">
          <input
            placeholder="New label"
            value={labelText}
            onChange={e => setLabelText(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="color"
            value={labelColor}
            onChange={e => setLabelColor(e.target.value)}
            style={{ width: 40, padding: 0, height: 36 }}
          />
          <button type="submit">Add</button>
        </form>

        <div className="section-title">Comments</div>
        {comments.map(c => (
          <div key={c.id} className="comment">
            <div className="author">{c.user_name}</div>
            <div>{c.body}</div>
            <div className="ts">
              {new Date(c.created_at + 'Z').toLocaleString()}
              {me?.id === c.user_id && (
                <a
                  href="#"
                  style={{ marginLeft: 8 }}
                  onClick={async (e) => {
                    e.preventDefault();
                    await api.deleteComment(c.id);
                    load();
                  }}
                >delete</a>
              )}
            </div>
          </div>
        ))}
        <form onSubmit={addComment} style={{ marginTop: 8 }}>
          <textarea
            placeholder="Write a comment…"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
          <div className="row" style={{ marginTop: 6 }}>
            <button type="submit">Comment</button>
          </div>
        </form>

        {err && <div className="error">{err}</div>}

        <div className="row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
          <button className="ghost" onClick={onClose}>Close</button>
          <button className="danger" onClick={deleteCard}>Delete card</button>
        </div>
      </div>
    </div>
  );
}
