import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SPINNER_KEYFRAMES = `@keyframes btn-spin { to { transform: rotate(360deg); } }`;

const s = {
  page: { background: '#ffffff', minHeight: '100vh', paddingTop: 60 },
  wrap: { maxWidth: 1200, margin: '0 auto', padding: '48px 48px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  h1: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 36, fontWeight: 900, color: '#0A2F5C', letterSpacing: '-0.02em' },
  addBtn: { background: '#0A2F5C', color: '#fff', padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em' },
  filters: { display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
  filterControl: { height: 44, padding: '0 12px', borderRadius: 0, border: '1px solid #e5e7eb', fontSize: 14, color: '#374151', background: '#ffffff', outline: 'none', width: 180, fontFamily: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 },
  card: (hovered) => ({
    background: '#fff',
    borderRadius: 6,
    padding: 24,
    boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.09)' : '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
    transition: 'box-shadow 0.18s',
    display: 'flex',
    flexDirection: 'column',
  }),
  categoryLabel: { fontSize: 11, fontWeight: 700, color: '#0A2F5C', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, opacity: 0.45 },
  cardTitle: { fontWeight: 700, marginBottom: 8, fontSize: 16, color: '#0A2F5C', letterSpacing: '-0.01em', lineHeight: 1.3 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 3, lineHeight: 1.5 },
  trustSignal: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  desc: { fontSize: 14, color: '#9ca3af', lineHeight: 1.6, marginTop: 10, flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardBottom: { display: 'flex', justifyContent: 'flex-start', marginTop: 16 },
  matchBtn: { background: '#0A2F5C', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  modalBackdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 1100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    background: '#fff',
    borderRadius: 6,
    padding: '32px 36px',
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
  },
  formTitle: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 24, color: '#0A2F5C', letterSpacing: '-0.02em' },
  aiRow: { display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 16 },
  aiTextarea: { flex: 1, padding: '12px 14px', fontSize: 14, borderRadius: 6, border: '1.5px solid #e5e7eb', resize: 'vertical', fontFamily: 'inherit', minHeight: 80 },
  parseBtn: (loading) => ({
    background: '#0A2F5C',
    color: '#fff', padding: '0 22px', fontSize: 14, fontWeight: 600,
    borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
  }),
  spinner: { width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'btn-spin 0.7s linear infinite', flexShrink: 0 },
  parseError: { fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 6, marginBottom: 0 },
  venueGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 0 },
  venueCard: (selected) => ({
    padding: '14px 16px', borderRadius: 6,
    border: `2px solid ${selected ? '#0A2F5C' : '#e5e7eb'}`,
    background: selected ? '#f0f5ff' : '#fafafa',
    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
  }),
  venueName: { fontWeight: 700, fontSize: 14, color: '#0A2F5C', marginBottom: 4 },
  venueAddr: { fontSize: 12, color: '#6b7280', lineHeight: 1.4 },
  venueHint: { fontSize: 12, color: '#0A2F5C', fontWeight: 600, marginBottom: 12 },
  input: { width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 6, border: '1.5px solid #e5e7eb', fontFamily: 'inherit', color: '#0A2F5C', background: '#fff', boxSizing: 'border-box' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  submitBtn: { background: '#0A2F5C', color: '#fff', padding: '13px 0', fontSize: 15, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', width: '100%' },
};

const NYC = { lat: 40.7128, lng: -74.0060 };

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
  const [form, setForm] = useState({ title: '', description: '', category: 'other', city: '', date: '', maxParticipants: 2, venueName: '', venueAddress: '' });
  const [intentText, setIntentText] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [suggestError, setSuggestError] = useState(null);
  const [locationCoords, setLocationCoords] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [browseLocation, setBrowseLocation] = useState(NYC);
  const [usingRealLocation, setUsingRealLocation] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBrowseLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUsingRealLocation(true);
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (!showForm) return;
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
      },
      () => setGettingLocation(false)
    );
  }, [showForm]);

  const load = async () => {
    const params = {};
    if (filters.city) params.city = filters.city;
    if (filters.category) params.category = filters.category;
    const userId = currentUser?._id || currentUser?.id;
    if (userId) params.excludeUserId = userId;
    if (browseLocation) {
      params.lat = browseLocation.lat;
      params.lng = browseLocation.lng;
      params.radius = usingRealLocation ? 40 : 50;
    }
    const res = await api.get('/activities', { params });
    setActivities(res.data);
  };

  useEffect(() => { if (currentUser) load(); }, [filters, currentUser, browseLocation]);

  const handleSuggest = async () => {
    if (!intentText.trim()) return;
    setSuggesting(true);
    setSuggestError(null);
    setVenues([]);
    setSelectedVenue(null);
    setForm((prev) => ({ ...prev, title: '', description: '' }));
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
    console.log('Selected venue location:', { lat: venue.lat, lng: venue.lng });
    setSelectedVenue(venue.place_id);
    setForm((prev) => ({ ...prev, title: venue.name, venueName: venue.name, venueAddress: venue.address }));
    if (venue.lat != null && venue.lng != null) {
      setLocationCoords({ lat: venue.lat, lng: venue.lng });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (locationCoords) payload.location = locationCoords;
    await api.post('/activities', payload);
    setShowForm(false);
    setForm({ title: '', description: '', category: 'other', city: '', date: '', maxParticipants: 2, venueName: '', venueAddress: '' });
    setLocationCoords(null);
    setIntentText('');
    setVenues([]);
    setSelectedVenue(null);
    load();
  };

  const closeForm = () => {
    setShowForm(false);
    setVenues([]);
    setSelectedVenue(null);
    setSuggestError(null);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={s.page}>
      <style>{SPINNER_KEYFRAMES}</style>
      {showForm && (
        <div style={s.modalBackdrop} onClick={closeForm}>
          <div style={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={s.formTitle}>New Activity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {gettingLocation && (
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Getting your location...</span>
                )}
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 24, padding: 0, lineHeight: 1 }}
                  onClick={closeForm}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div style={s.aiRow}>
              <textarea
                style={s.aiTextarea}
                placeholder="e.g. want to do something outdoorsy Saturday morning in San Francisco, nothing too touristy"
                value={intentText}
                onChange={(e) => setIntentText(e.target.value)}
              />
              <button type="button" style={s.parseBtn(suggesting)} onClick={handleSuggest} disabled={suggesting || !intentText.trim()}>
                {suggesting && <span style={s.spinner} />}
                {suggesting ? 'Finding...' : 'Find venues'}
              </button>
            </div>
            {suggestError && <div style={{ ...s.parseError, marginBottom: 16 }}>{suggestError}</div>}

            {venues.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={s.venueHint}>
                  {selectedVenue ? 'Venue selected. Review details below and post.' : 'Pick a venue to use as the activity location.'}
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

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input style={s.input} value={form.title} onChange={set('title')} required placeholder="Venue / activity title" />
              <div style={s.twoCol}>
                <input style={s.input} value={form.city} onChange={set('city')} required placeholder="City" />
                <input style={s.input} type="date" value={form.date} onChange={set('date')} required />
              </div>
              <select style={s.input} value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea style={{ ...s.input, resize: 'vertical' }} rows={2} value={form.description} onChange={set('description')} placeholder="Add more details (optional)" />
              <button type="submit" style={s.submitBtn}>Post</button>
            </form>
          </div>
        </div>
      )}

      <div style={s.wrap}>
        <div style={s.header}>
          <h1 style={s.h1}>Browse Activities</h1>
          <button style={s.addBtn} onClick={() => setShowForm(true)}>+ Post Activity</button>
        </div>

        <div style={s.filters}>
          <input
            style={s.filterControl}
            placeholder="Filter by city..."
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
          <select
            style={s.filterControl}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
          {usingRealLocation ? 'Showing activities near you' : 'Showing activities in New York City'}
        </div>

        <div style={s.grid}>
          {activities.map((a) => {
            const isHovered = hoveredCard === a._id;
            return (
              <div
                key={a._id}
                style={s.card(isHovered)}
                onMouseEnter={() => setHoveredCard(a._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={s.categoryLabel}>{a.category}</div>
                <div style={s.cardTitle}>{a.title}</div>
                <div style={s.meta}>{a.city} · {new Date(a.date).toLocaleDateString()}</div>
                <div style={s.meta}>By {a.user?.name}</div>
                {a.user && (
                  a.user.completedMeetups
                    ? <div style={s.trustSignal}>★ {(a.user.averageRating || 0).toFixed(1)} · {a.user.completedMeetups} meetup{a.user.completedMeetups !== 1 ? 's' : ''}</div>
                    : <div style={s.trustSignal}>New traveler</div>
                )}
                {a.description && <div style={s.desc}>{a.description}</div>}
                <div style={s.cardBottom}>
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
              </div>
            );
          })}
          {activities.length === 0 && <div style={{ fontSize: 14, color: '#9ca3af' }}>No activities found.</div>}
        </div>
      </div>
    </div>
  );
}
