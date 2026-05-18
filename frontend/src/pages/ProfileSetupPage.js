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
    tags: ['Running', 'Yoga', 'Surfing', 'Basketball', 'Tennis', 'Martial Arts'],
  },
];

const s = {
  page: { background: '#E8F5E3', minHeight: '100vh', padding: '60px 24px' },
  wrap: { maxWidth: 620, margin: '0 auto' },
  h1: { fontSize: 28, fontWeight: 800, color: '#0A2F5C', marginBottom: 8, letterSpacing: '-0.02em' },
  sub: { fontSize: 15, color: '#6b7280', marginBottom: 40, lineHeight: 1.6 },
  category: { marginBottom: 32 },
  categoryLabel: { fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1A6FA8', marginBottom: 12 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: (selected) => ({
    padding: '8px 16px',
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: `1.5px solid ${selected ? '#0F4A80' : '#A8D5C2'}`,
    background: selected ? '#0F4A80' : '#fff',
    color: selected ? '#fff' : '#0A2F5C',
    transition: 'all 0.15s',
  }),
  footer: { marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: 13, color: '#6b7280' },
  btn: { background: '#0F4A80', color: '#fff', padding: '12px 32px', fontSize: 15, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
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
        <h1 style={s.h1}>What are you into?</h1>
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
