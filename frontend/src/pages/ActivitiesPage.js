import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  h1: { fontSize: 28, fontWeight: 800, color: '#0A2F5C', letterSpacing: '-0.02em' },
  addBtn: { background: '#0F4A80', color: '#fff', padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
  filters: { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  filterInput: { maxWidth: 180 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', border: '1px solid #f3f4f6' },
  cardTitle: { fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#0A2F5C', letterSpacing: '-0.01em' },
  badge: { display: 'inline-block', background: '#E8F5E3', color: '#0F4A80', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, marginBottom: 10 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  matchBtn: { background: '#0F4A80', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', marginTop: 14, borderRadius: 7, border: 'none', cursor: 'pointer' },
  form: { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', marginBottom: 32, border: '1px solid #f3f4f6' },
  formTitle: { fontWeight: 700, fontSize: 18, marginBottom: 20, color: '#0A2F5C', letterSpacing: '-0.01em' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' },
  submitBtn: { background: '#0F4A80', color: '#fff', padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
  cancelBtn: { background: '#f3f4f6', color: '#374151', padding: '10px 24px', marginLeft: 8, fontSize: 14, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer' },
  aiRow: { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  aiTextarea: { flex: 1, padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1.5px solid #e5e7eb', resize: 'vertical', fontFamily: 'inherit', minHeight: 60 },
  parseBtn: (loading) => ({
    background: loading ? '#A8D5C2' : '#0d9488',
    color: '#fff', padding: '10px 18px', fontSize: 14, fontWeight: 600,
    borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  }),
  aiDivider: { borderTop: '1px solid #f3f4f6', margin: '20px 0' },
  parseError: { fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 12 },
  venueGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 },
  venueCard: (selected) => ({
    padding: '14px 16px', borderRadius: 10,
    border: `2px solid ${selected ? '#0F4A80' : '#e5e7eb'}`,
    background: selected ? '#f0f5ff' : '#fafafa',
    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
  }),
  venueName: { fontWeight: 700, fontSize: 14, color: '#0A2F5C', marginBottom: 4 },
  venueAddr: { fontSize: 12, color: '#6b7280', lineHeight: 1.4 },
  venueHint: { fontSize: 12, color: '#0d9488', fontWeight: 600, marginBottom: 16 },
};

const CATEGORIES = ['hiking', 'food', 'nightlife', 'culture', 'adventure', 'relaxation', 'other'];

const CATEGORY_MAP = {
  hiking: 'hiking', food: 'food', music: 'nightlife', museums: 'culture',
  photography: 'culture', cycling: 'adventure', yoga: 'relaxation',
  coffee: 'food', amusement_parks: 'adventure', cooking: 'food',
  art: 'culture', sports: 'adventure', other: 'other',
};

const toDateInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return '';
};

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ city: '', category: '' });
  const [form, setForm] = useState({ title: '', description: '', category: 'other', city: '', date: '', maxParticipants: 2 });
  const [intentText, setIntentText] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [suggestError, setSuggestError] = useState(null);

  const load = async () => {
    const params = {};
    if (filters.city) params.city = filters.city;
    if (filters.category) params.category = filters.category;
    const userId = currentUser?._id || currentUser?.id;
    if (userId) params.excludeUserId = userId;
    const res = await api.get('/activities', { params });
    setActivities(res.data);
  };

  useEffect(() => { if (currentUser) load(); }, [filters, currentUser]);

  const handleSuggest = async () => {
    if (!intentText.trim()) return;
    setSuggesting(true);
    setSuggestError(null);
    setVenues([]);
    setSelectedVenue(null);
    try {
      const res = await api.post('/activities/suggest', { text: intentText, city: form.city || undefined });
      const { parsed, venues: v } = res.data;
      setVenues(v);
      setSelectedVenue(null);
      setForm((prev) => ({
        ...prev,
        title: '',
        category: CATEGORY_MAP[parsed.category] || prev.category,
        city: parsed.city || prev.city,
        date: toDateInput(parsed.date) || prev.date,
        description: parsed.description || prev.description,
      }));
    } catch (err) {
      setSuggestError(err.response?.data?.message || 'Could not find venues. Try adding a city name to your description.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleSelectVenue = (venue) => {
    setSelectedVenue(venue.place_id);
    setForm((prev) => ({ ...prev, title: venue.name }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/activities', form);
    setShowForm(false);
    setForm({ title: '', description: '', category: 'other', city: '', date: '', maxParticipants: 2 });
    setIntentText('');
    setVenues([]);
    setSelectedVenue(null);
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.h1}>Browse Activities</h1>
        <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Post Activity'}
        </button>
      </div>

      {showForm && (
        <div style={s.form}>
          <div style={s.formTitle}>Post a New Activity</div>
          <div style={s.field}>
            <label style={s.label}>Describe what you want to do</label>
            <div style={s.aiRow}>
              <textarea
                style={s.aiTextarea}
                rows={2}
                placeholder="e.g. want to do something outdoorsy Saturday morning in San Francisco, nothing too touristy"
                value={intentText}
                onChange={(e) => setIntentText(e.target.value)}
              />
              <button type="button" style={s.parseBtn(suggesting)} onClick={handleSuggest} disabled={suggesting || !intentText.trim()}>
                {suggesting ? 'Finding real venues...' : 'Find venues'}
              </button>
            </div>
            {suggestError && <div style={s.parseError}>{suggestError}</div>}
          </div>

          {venues.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={s.venueHint}>
                {selectedVenue ? 'Venue selected. Review fields below and post.' : 'Pick a venue to use as the activity location.'}
              </div>
              <div style={s.venueGrid}>
                {venues.map((v) => (
                  <div key={v.place_id} style={s.venueCard(selectedVenue === v.place_id)} onClick={() => handleSelectVenue(v)}>
                    <div style={s.venueName}>{v.name}</div>
                    <div style={s.venueAddr}>{v.address}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={s.aiDivider} />

          <form onSubmit={handleCreate}>
            <div style={s.row}>
              <div>
                <label style={s.label}>Title</label>
                <input value={form.title} onChange={set('title')} required placeholder="Activity title" />
              </div>
              <div>
                <label style={s.label}>City</label>
                <input value={form.city} onChange={set('city')} required placeholder="City" />
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
            <button
              style={s.matchBtn}
              onClick={async () => {
                try {
                  await api.post('/matches', { activityId: a._id, targetUserId: a.user._id });
                  navigate('/matches');
                } catch (err) {
                  console.error('Connect failed:', err.response?.data || err.message);
                }
              }}
            >
              Connect
            </button>
          </div>
        ))}
        {activities.length === 0 && <div style={{ color: '#6b7280' }}>No activities found.</div>}
      </div>
    </div>
  );
}
