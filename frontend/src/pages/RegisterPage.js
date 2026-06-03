import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  page: { background: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  wrap: { maxWidth: 420, width: '100%', margin: '0 24px', padding: 36, background: '#fff', borderRadius: 16, boxShadow: '0 2px 24px rgba(10,47,92,0.08)' },
  h2: { fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#0A2F5C', letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 28 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  btn: { background: '#0F4A80', color: '#fff', width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 8, letterSpacing: '-0.01em' },
  err: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
  foot: { marginTop: 24, fontSize: 13, color: '#6b7280', textAlign: 'center' },
  link: { color: '#0F4A80', fontWeight: 600 },
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/profile-setup');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h2 style={s.h2}>Create your account</h2>
        <p style={s.sub}>Join Detour and start exploring with others.</p>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Name</label>
            <input value={form.name} onChange={set('name')} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input type="password" value={form.password} onChange={set('password')} minLength={6} required />
          </div>
          <button type="submit" style={s.btn}>Create Account</button>
        </form>
        <div style={s.foot}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></div>
      </div>
    </div>
  );
}
