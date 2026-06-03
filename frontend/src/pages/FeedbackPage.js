import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const StarRating = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: 36,
          color: n <= value ? '#f59e0b' : '#d1d5db',
          transition: 'color 0.12s',
          lineHeight: 1,
        }}
      >
        ★
      </button>
    ))}
  </div>
);

const s = {
  page: { background: '#ffffff', minHeight: '100vh', padding: '120px 24px 60px' },
  wrap: { maxWidth: 600, margin: '0 auto' },
  h1: { fontSize: 26, fontWeight: 800, color: '#0A2F5C', marginBottom: 6, letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 36 },
  card: { background: '#fff', borderRadius: 6, padding: '36px 40px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  field: { marginBottom: 28 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' },
  checkRow: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151', cursor: 'pointer' },
  submitBtn: { background: '#0F4A80', color: '#fff', padding: '12px 32px', fontSize: 15, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%' },
  backBtn: { background: 'transparent', color: '#6b7280', padding: '12px 0', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', marginTop: 12, display: 'block' },
  errMsg: { color: '#dc2626', fontSize: 13, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, marginBottom: 16 },
  successBox: { textAlign: 'center', padding: '40px 0' },
  successMsg: { fontSize: 20, fontWeight: 700, color: '#0A2F5C', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#6b7280', marginBottom: 28 },
};

export default function FeedbackPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ rating: 5, comment: '', itineraryUseful: true, wouldMeetAgain: true });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [matchTitle, setMatchTitle] = useState('');

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
              <div style={s.successSub}>Your input helps improve future matches.</div>
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
        <h1 style={s.h1}>Share Feedback</h1>
        <p style={s.sub}>{matchTitle ? `How did your meetup for "${matchTitle}" go?` : 'How did your meetup go?'}</p>
        <div style={s.card}>
          {error && <div style={s.errMsg}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Rating</label>
              <StarRating value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Comment</label>
              <textarea
                rows={4}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="What was the highlight? Anything that could be better?"
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 14 }}
              />
            </div>
            <div style={s.checkRow}>
              <label style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.itineraryUseful}
                  onChange={(e) => setForm({ ...form, itineraryUseful: e.target.checked })}
                  style={{ width: 'auto', accentColor: '#0F4A80' }}
                />
                The AI-generated itinerary was useful
              </label>
              <label style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.wouldMeetAgain}
                  onChange={(e) => setForm({ ...form, wouldMeetAgain: e.target.checked })}
                  style={{ width: 'auto', accentColor: '#0F4A80' }}
                />
                I'd meet this person again
              </label>
            </div>
            <button type="submit" style={s.submitBtn}>Submit Feedback</button>
            <button type="button" style={s.backBtn} onClick={() => navigate('/matches')}>
              Back to My Matches
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
