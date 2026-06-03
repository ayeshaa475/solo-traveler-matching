import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CATEGORIES = [
  {
    label: 'Outdoors',
    tags: ['Hiking', 'Cycling', 'Camping', 'Swimming', 'Rock Climbing', 'Kayaking'],
  },
  {
    label: 'Food & Drink',
    tags: ['Food Tours', 'Coffee', 'Street Food', 'Wine Tasting', 'Cooking Classes', 'Night Markets'],
  },
  {
    label: 'Culture & Art',
    tags: ['Museums', 'Architecture', 'Photography', 'Local History', 'Galleries', 'Walking Tours'],
  },
  {
    label: 'Music',
    tags: ['Live Music', 'Jazz', 'Electronic', 'Open Mics', 'Concerts', 'Record Stores'],
  },
  {
    label: 'Sports',
    tags: ['Running', 'Yoga', 'Surfing', 'Basketball', 'Tennis'],
  },
];

const s = {
  page: { background: '#ffffff', minHeight: '100vh', padding: '120px 48px 80px' },
  wrap: { maxWidth: 700, margin: '0 auto' },
  h1: { fontSize: 36, fontWeight: 800, color: '#0A2F5C', marginBottom: 10, letterSpacing: '-0.02em', fontFamily: 'Fraunces, serif' },
  sub: { fontSize: 15, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 },
  category: { marginBottom: 40 },
  categoryLabel: { fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0A2F5C', marginBottom: 14 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  tag: (selected) => ({
    padding: '10px 18px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid #0A2F5C`,
    background: selected ? '#0A2F5C' : '#ffffff',
    color: selected ? '#ffffff' : '#0A2F5C',
    transition: 'all 0.12s',
  }),
  footer: { marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: 13, color: '#6b7280' },
  btn: { background: '#0A2F5C', color: '#fff', padding: '12px 32px', fontSize: 15, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
  skip: { background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer', textDecoration: 'underline', padding: 0 },
};

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (tag) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await api.patch('/auth/profile', { interests: [...selected] });
    navigate('/activities');
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>What are your interests?</h1>
        <p style={s.sub}>Pick as many as you like. We'll use these to match you with travelers who share your interests.</p>

        {CATEGORIES.map((cat) => (
          <div key={cat.label} style={s.category}>
            <div style={s.categoryLabel}>{cat.label}</div>
            <div style={s.tags}>
              {cat.tags.map((tag) => (
                <button key={tag} style={s.tag(selected.has(tag))} onClick={() => toggle(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={s.footer}>
          <span style={s.count}>{selected.size} selected</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button style={s.skip} onClick={() => navigate('/activities')}>Skip for now</button>
            <button style={s.btn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save & continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
