import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  async function load() {
    try {
      const { boards } = await api.listBoards();
      setBoards(boards);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function createBoard(e) {
    e.preventDefault();
    setErr('');
    try {
      const { board } = await api.createBoard(name, description);
      setName(''); setDescription(''); setCreating(false);
      navigate(`/boards/${board.id}`);
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="dashboard">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Boards</h1>
        <button onClick={() => setCreating(true)}>+ New board</button>
      </div>

      {creating && (
        <form onSubmit={createBoard} style={{ marginTop: 20, background: 'white', padding: 16, borderRadius: 6 }}>
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          {err && <div className="error">{err}</div>}
          <div className="row">
            <button type="submit">Create</button>
            <button type="button" className="ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="board-grid">
        {boards.map(b => (
          <div key={b.id} className="board-tile" onClick={() => navigate(`/boards/${b.id}`)}>
            <h3>{b.name}</h3>
            <small>by {b.creator_name}</small>
            {b.description && <p style={{ fontSize: 13, color: '#5e6c84', marginTop: 8 }}>{b.description}</p>}
          </div>
        ))}
        {boards.length === 0 && <p className="muted">No boards yet — create your first one.</p>}
      </div>
    </div>
  );
}
