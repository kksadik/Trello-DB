import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Board from './pages/Board.jsx';
import { getToken, getUser, clearSession } from './api/client.js';

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function TopBar() {
  const navigate = useNavigate();
  const user = getUser();
  if (!user) return null;
  return (
    <div className="topbar">
      <Link to="/">Team Board</Link>
      <div className="row">
        <span style={{ marginRight: 12 }}>Hi, {user.name}</span>
        <button className="ghost" onClick={() => { clearSession(); navigate('/login'); }}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/boards/:id" element={<RequireAuth><Board /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
