import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '../api/client.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const { token, user } = await api.login(email, password);
      setSession(token, user);
      navigate('/');
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="center-card">
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {err && <div className="error">{err}</div>}
        <button type="submit" style={{ width: '100%' }}>Login</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
