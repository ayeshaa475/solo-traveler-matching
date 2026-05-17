import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const s = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { fontSize: 26, fontWeight: 700, color: '#1e1b4b' },
  addBtn: { background: '#4f46e5', color: '#fff', padding: '10px 20px' },
  filters: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  filterInput: { maxWidth: 180 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#1e1b4b' },
  badge: { display: 'inline-block', background: '#ede9fe', color: '#4f46e5', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, marginBottom: 8 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  matchBtn: { background: '#10b981', color: '#fff', fontSize: 13, padding: '8px 14px', marginTop: 12 },
  form: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 32 },
  formTitle: { fontWeight: 700, fontSize: 18, marginBottom: 16, color: '#1e1b4b' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' },
  submitBtn: { background: '#4f46e5', color: '#fff', padding: '10px 24px' },
  cancelBtn: { background: '#e5e7eb', color: '#374151', padding: '10px 24px', marginLeft: 8 },
};

const CATEGORIES = ['hiking', 'food', 'nightlife', 'culture', 'adventure', 'relaxation', 'other'];

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ city: '', category: '' });
  const [form, setForm] = useState({ title: '', description: '', category: 'other', city: '', date: '', maxParticipants: 2 });

  const load = async () => {
    const params = {};
    if (filters.city) params.city = filters.city;
    if (filters.category) params.category = filters.category;
    const res = await api.get('/activities', { params });
    setActivities(res.data);
  };

  useEffect(() => { load(); }, [filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/activities', form);
    setShowForm(false);
    setForm({ title: '', description: '', category: 'other', city: '', date: '', maxParticipants: 2 });
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.h1}>Activities</h1>
        <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Post Activity'}
        </button>
      </div>

      {showForm && (
        <div style={s.form}>
          <div style={s.formTitle}>Post a New Activity</div>
          <form onSubmit={handleCreate}>
            <div style={s.row}>
              <div>
                <label style={s.label}>Title</label>
                <input value={form.title} onChange={set('title')} required />
              </div>
              <div>
                <label style={s.label}>City</label>
                <input value={form.city} onChange={set('city')} required />
              </div>
            </div>
            <div style={s.row}>
              <div>
                <label style={s.label}>Category</label>
                <select value={form.category} onChange={set('category')}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Date</label>
                <input type="date" value={form.date} onChange={set('date')} required />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea rows={3} value={form.description} onChange={set('description')} />
            </div>
            <button type="submit" style={s.submitBtn}>Post Activity</button>
            <button type="button" style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div style={s.filters}>
        <input style={s.filterInput} placeholder="Filter by city..." value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
        <select style={{ ...s.filterInput, padding: '10px 12px' }} value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={s.grid}>
        {activities.map((a) => (
          <div key={a._id} style={s.card}>
            <span style={s.badge}>{a.category}</span>
            <div style={s.cardTitle}>{a.title}</div>
            <div style={s.meta}>{a.city} · {new Date(a.date).toLocaleDateString()}</div>
            <div style={s.meta}>By {a.user?.name}</div>
            {a.description && <div style={{ ...s.meta, marginTop: 8 }}>{a.description}</div>}
            <button style={s.matchBtn} onClick={() => navigate(`/matches?activityId=${a._id}`)}>
              Find Matches
            </button>
          </div>
        ))}
        {activities.length === 0 && <div style={{ color: '#6b7280' }}>No activities found.</div>}
      </div>
    </div>
  );
}
