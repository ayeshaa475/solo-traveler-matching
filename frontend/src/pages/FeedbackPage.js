import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const RATING_LABELS = { 1: 'Terrible', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent' };

const StarRating = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              fontSize: 40,
              lineHeight: 1,
              color: n <= active ? '#F59E0B' : '#D1D5DB',
              transition: 'color 0.12s, transform 0.1s',
              transform: n <= active ? 'scale(1.1)' : 'scale(1)',
            }}
            aria-label={`Rate ${n} star`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && (
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0A2F5C' }}>
          {RATING_LABELS[value]}
        </span>
      )}
    </div>
  );
};

const ToggleCard = ({ checked, onChange, label }) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '16px 20px',
      borderRadius: 10,
      border: `2px solid ${checked ? '#0A2F5C' : '#E5E7EB'}`,
      background: checked ? '#F0F5FF' : '#FAFAFA',
      cursor: 'pointer',
      transition: 'border-color 0.15s, background 0.15s',
      userSelect: 'none',
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ width: 20, height: 20, accentColor: '#0A2F5C', cursor: 'pointer', flexShrink: 0 }}
    />
    <span style={{ fontSize: 15, color: '#1F2937', fontWeight: checked ? 600 : 400 }}>{label}</span>
  </label>
);

const s = {
  page: {
    background: '#F8F9FB',
    minHeight: '100vh',
    padding: '100px 24px 80px',
    fontFamily: "'Inter', sans-serif",
  },
  wrap: { maxWidth: 560, margin: '0 auto' },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 36,
    fontWeight: 700,
    color: '#0A2F5C',
    margin: '0 0 10px',
    lineHeight: 1.15,
  },
  sub: { fontSize: 18, color: '#6B7280', margin: '0 0 36px', lineHeight: 1.5 },
  subActivity: { color: '#0A2F5C', fontWeight: 700 },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 40px 36px',
    boxShadow: '0 2px 12px rgba(10,47,92,0.07)',
    border: '1px solid #EEF0F4',
  },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, letterSpacing: '0.03em', textTransform: 'uppercase' },
  textarea: {
    width: '100%',
    minHeight: 120,
    fontFamily: "'Inter', sans-serif",
    fontSize: 15,
    color: '#111827',
    border: '1.5px solid #D1D5DB',
    borderRadius: 10,
    padding: '14px 16px',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.6,
    transition: 'border-color 0.15s',
  },
  submitBtn: {
    display: 'block',
    width: '100%',
    height: 48,
    background: '#0A2F5C',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'background 0.15s',
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#9CA3AF',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    padding: 0,
  },
  errMsg: {
    color: '#DC2626',
    fontSize: 13,
    padding: '10px 14px',
    background: '#FEF2F2',
    borderRadius: 8,
    marginBottom: 24,
  },
  successBox: { textAlign: 'center', padding: '20px 0' },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successMsg: {
    fontFamily: "'Fraunces', serif",
    fontSize: 28,
    fontWeight: 700,
    color: '#0A2F5C',
    marginBottom: 8,
  },
  successSub: { fontSize: 15, color: '#6B7280', marginBottom: 32 },
};

const SPACING = { marginBottom: 24 };

export default function FeedbackPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ rating: 0, comment: '', itineraryUseful: true, wouldMeetAgain: true });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [matchTitle, setMatchTitle] = useState('');
  const [textareaFocused, setTextareaFocused] = useState(false);

  useEffect(() => {
    api.get('/matches/my').then((r) => {
      const match = r.data.find((m) => m._id === matchId);
      if (match?.activity?.title) setMatchTitle(match.activity.title);
    }).catch(() => {});
  }, [matchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/feedback', { ...form, matchId });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.wrap}>
          <div style={s.card}>
            <div style={s.successBox}>

              <div style={s.successMsg}>Thanks for your feedback!</div>
              <div style={s.successSub}>Your input helps us improve future matches.</div>
              <button style={s.submitBtn} onClick={() => navigate('/matches')}>Back to My Matches</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.title}>Share Feedback</h1>
        <p style={s.sub}>
          {matchTitle ? (
            <>How did your meetup for <span style={s.subActivity}>{matchTitle}</span> go?</>
          ) : (
            'How did your meetup go?'
          )}
        </p>

        <div style={s.card}>
          {error && <div style={s.errMsg}>{error}</div>}
          <form onSubmit={handleSubmit}>

            <div style={SPACING}>
              <label style={s.label}>Your Rating</label>
              <StarRating value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
            </div>

            <div style={SPACING}>
              <label style={s.label}>Comment</label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                onFocus={() => setTextareaFocused(true)}
                onBlur={() => setTextareaFocused(false)}
                placeholder="What was the highlight? Anything that could be better?"
                style={{
                  ...s.textarea,
                  borderColor: textareaFocused ? '#0A2F5C' : '#D1D5DB',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...SPACING }}>
              <ToggleCard
                checked={form.itineraryUseful}
                onChange={(v) => setForm({ ...form, itineraryUseful: v })}
                label="The AI-generated itinerary was useful"
              />
              <ToggleCard
                checked={form.wouldMeetAgain}
                onChange={(v) => setForm({ ...form, wouldMeetAgain: v })}
                label="I'd meet this person again"
              />
            </div>

            <div style={SPACING}>
              <button type="submit" style={s.submitBtn}>Submit Feedback</button>
              <button type="button" style={s.backLink} onClick={() => navigate('/matches')}>
                Back to My Matches
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
