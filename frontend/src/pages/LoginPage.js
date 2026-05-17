import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { maxWidth: 400, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  h2: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#1e1b4b' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  btn: { background: '#4f46e5', color: '#fff', width: '100%', padding: '12px', fontSize: 15, marginTop: 8 },
  err: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
  foot: { marginTop: 20, fontSize: 13, color: '#6b7280', textAlign: 'center' },
  link: { color: '#4f46e5', fontWeight: 600 },
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
    <div style={s.wrap}>
      <h2 style={s.h2}>Welcome back</h2>
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
  );
}
