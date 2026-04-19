import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '../api/client.js';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const { token, user } = await api.register(name, email, password);
      setSession(token, user);
      navigate('/');
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="center-card">
      <h1>Create account</h1>
      <form onSubmit={submit}>
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password (min 6 chars)</label>
          <input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {err && <div className="error">{err}</div>}
        <button type="submit" style={{ width: '100%' }}>Sign up</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
