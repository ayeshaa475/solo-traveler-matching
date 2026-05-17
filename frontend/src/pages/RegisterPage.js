import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { maxWidth: 420, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  h2: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#1e1b4b' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  btn: { background: '#4f46e5', color: '#fff', width: '100%', padding: '12px', fontSize: 15, marginTop: 8 },
  err: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
  foot: { marginTop: 20, fontSize: 13, color: '#6b7280', textAlign: 'center' },
  link: { color: '#4f46e5', fontWeight: 600 },
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
      navigate('/activities');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.h2}>Create your account</h2>
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
  );
}
