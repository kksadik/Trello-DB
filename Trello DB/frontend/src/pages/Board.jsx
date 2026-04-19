import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import CardModal from '../components/CardModal.jsx';

function initials(name) {
  return (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
}

export default function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [openCardId, setOpenCardId] = useState(null);
  const [addingTo, setAddingTo] = useState(null); // listId
  const [newTitle, setNewTitle] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [err, setErr] = useState('');

  const reload = useCallback(async () => {
    try {
      const data = await api.getBoard(id);
      setBoard(data.board);
      setLists(data.lists);
      setCards(data.cards);
      setMembers(data.members);
    } catch (e) {
      setErr(e.message);
      if (String(e.message).includes('Not a member')) navigate('/');
    }
  }, [id, navigate]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { api.users().then(d => setAllUsers(d.users)).catch(() => {}); }, []);

  async function addCard(listId, e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api.createCard(listId, { title: newTitle.trim() });
    setNewTitle(''); setAddingTo(null);
    reload();
  }

  async function addMember(e) {
    e.preventDefault();
    setErr('');
    try {
      await api.addMember(id, { email: memberEmail });
      setMemberEmail(''); setShowAddMember(false);
      reload();
    } catch (e) { setErr(e.message); }
  }

  if (!board) {
    return <div className="dashboard">{err ? <p className="error">{err}</p> : <p>Loading…</p>}</div>;
  }

  return (
    <>
      <div style={{ background: '#0079bf', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ fontSize: 18 }}>{board.name}</strong>
          {board.description && <span style={{ marginLeft: 12, opacity: 0.9 }}>{board.description}</span>}
        </div>
        <div className="row">
          {members.map(m => (
            <span key={m.id} className="assignee-chip" title={`${m.name} (${m.role})`}>{initials(m.name)}</span>
          ))}
          <button className="ghost" onClick={() => setShowAddMember(s => !s)}>+ Member</button>
        </div>
      </div>

      {showAddMember && (
        <form onSubmit={addMember} style={{ background: '#026aa7', color: 'white', padding: '10px 20px', display: 'flex', gap: 8 }}>
          <input
            placeholder="user email"
            value={memberEmail}
            onChange={e => setMemberEmail(e.target.value)}
            style={{ maxWidth: 280 }}
            required
          />
          <button type="submit">Add</button>
          {err && <span className="error" style={{ color: '#ffd2cc' }}>{err}</span>}
        </form>
      )}

      <div className="kanban">
        {lists.map(l => {
          const colCards = cards.filter(c => c.list_id === l.id);
          return (
            <div key={l.id} className="kanban-col">
              <h4>{l.name} <span className="muted" style={{ fontWeight: 400 }}>({colCards.length})</span></h4>
              <div className="col-cards">
                {colCards.map(c => (
                  <div key={c.id} className="card" onClick={() => setOpenCardId(c.id)}>
                    <div>{c.title}</div>
                    {(c.labels?.length > 0 || c.due_date || c.assignees?.length > 0) && (
                      <div className="meta">
                        {c.labels?.map(lab => (
                          <span key={lab.id} className="label-chip" style={lab.color ? { background: lab.color, color: 'white' } : null}>{lab.label}</span>
                        ))}
                        {c.due_date && <span>📅 {c.due_date.slice(0, 10)}</span>}
                        {c.assignees?.map(a => (
                          <span key={a.id} className="assignee-chip" title={a.name}>{initials(a.name)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {addingTo === l.id ? (
                <form onSubmit={(e) => addCard(l.id, e)} style={{ padding: '0 8px 8px' }}>
                  <input
                    autoFocus
                    placeholder="Card title"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                  />
                  <div className="row" style={{ marginTop: 6 }}>
                    <button type="submit">Add</button>
                    <button type="button" className="ghost" onClick={() => { setAddingTo(null); setNewTitle(''); }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <button className="add-card-btn" onClick={() => setAddingTo(l.id)}>+ Add a card</button>
              )}
            </div>
          );
        })}
      </div>

      {openCardId && (
        <CardModal
          cardId={openCardId}
          allUsers={allUsers}
          lists={lists}
          onClose={() => { setOpenCardId(null); reload(); }}
        />
      )}
    </>
  );
}
