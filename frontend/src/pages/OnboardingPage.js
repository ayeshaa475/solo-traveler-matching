import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const INTERESTS = [
  'Hiking', 'Food & Drink', 'Live Music', 'Museums', 'Photography', 'Cycling',
  'Yoga', 'Coffee Shops', 'Amusement Parks', 'Cooking', 'Art & Culture', 'Live Sports',
];

const s = {
  page: {
    background: '#ffffff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
  },
  inner: { maxWidth: 680, width: '100%' },
  h1: {
    fontSize: 40,
    fontWeight: 800,
    color: '#0A2F5C',
    marginBottom: 56,
    letterSpacing: '-0.02em',
    textAlign: 'center',
  },
  sub: {
    fontSize: 17,
    color: '#6b7280',
    lineHeight: 1.6,
    textAlign: 'center',
    marginBottom: 100,
    fontWeight: 400,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 48,
  },
  tag: (selected) => ({
    padding: '16px 12px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    border: `2px solid ${selected ? '#2E9DC8' : '#e5e7eb'}`,
    background: selected ? '#E8F5E3' : '#ffffff',
    color: selected ? '#0A2F5C' : '#374151',
    textAlign: 'center',
    transition: 'border-color 0.15s, background 0.15s',
    userSelect: 'none',
  }),
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  count: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: 500,
  },
  btn: (active) => ({
    background: active ? '#0F4A80' : '#e5e7eb',
    color: active ? '#ffffff' : '#9ca3af',
    padding: '15px 48px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 10,
    border: 'none',
    cursor: active ? 'pointer' : 'not-allowed',
    letterSpacing: '-0.01em',
    transition: 'background 0.15s',
  }),
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());

  const toggle = (tag) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const handleContinue = () => {
    if (selected.size < 3) return;
    localStorage.setItem('detour_interests', JSON.stringify([...selected]));
    navigate('/register');
  };

  const active = selected.size >= 3;

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.h1}>Pick your interests so we can find your perfect travel match.</h1>

        <div style={s.grid}>
          {INTERESTS.map((tag) => (
            <button
              key={tag}
              style={s.tag(selected.has(tag))}
              onClick={() => toggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div style={s.footer}>
          <div style={s.count}>
            {selected.size < 3
              ? `Pick at least ${3 - selected.size} more`
              : `${selected.size} selected`}
          </div>
          <button style={s.btn(active)} onClick={handleContinue} disabled={!active}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
