import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  page: { background: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  wrap: { maxWidth: 400, width: '100%', margin: '0 24px', padding: 36, background: '#fff', borderRadius: 16, boxShadow: '0 2px 24px rgba(10,47,92,0.08)' },
  h2: { fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#0A2F5C', letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 28 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  btn: { background: '#0F4A80', color: '#fff', width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 8, letterSpacing: '-0.01em' },
  err: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
  foot: { marginTop: 24, fontSize: 13, color: '#6b7280', textAlign: 'center' },
  link: { color: '#0F4A80', fontWeight: 600 },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/activities');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h2 style={s.h2}>Welcome back</h2>
        <p style={s.sub}>Sign in to find your next travel companion.</p>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" style={s.btn}>Sign In</button>
        </form>
        <div style={s.foot}>Don't have an account? <Link to="/register" style={s.link}>Register</Link></div>
      </div>
    </div>
  );
}
