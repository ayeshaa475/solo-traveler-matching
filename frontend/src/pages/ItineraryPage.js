import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const s = {
  wrap: { maxWidth: 700, margin: '0 auto', padding: '40px 24px' },
  h1: { fontSize: 28, fontWeight: 800, color: '#0A2F5C', marginBottom: 8, letterSpacing: '-0.02em' },
  summary: { color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 36 },
  stop: { background: '#fff', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', border: '1px solid #f3f4f6' },
  stopInner: { borderLeft: '4px solid #0F4A80', paddingLeft: 16 },
  time: { fontWeight: 700, color: '#0F4A80', fontSize: 13, marginBottom: 4 },
  place: { fontWeight: 700, fontSize: 16, color: '#0A2F5C', marginBottom: 4, letterSpacing: '-0.01em' },
  desc: { fontSize: 14, color: '#6b7280', lineHeight: 1.65 },
  duration: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  actionBox: { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', marginTop: 36, border: '1px solid #f3f4f6' },
  feedbackBox: { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', marginTop: 16, border: '1px solid #f3f4f6' },
  h2: { fontSize: 18, fontWeight: 700, color: '#0A2F5C', marginBottom: 8, letterSpacing: '-0.01em' },
  completedMsg: { fontSize: 22, fontWeight: 800, color: '#0A2F5C', marginBottom: 6, letterSpacing: '-0.01em' },
  completedSub: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  row: { display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
  btnRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  primaryBtn: { background: '#0F4A80', color: '#fff', padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
  secondaryBtn: { background: '#1A6FA8', color: '#fff', padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
  cancelBtn: { background: 'transparent', color: '#6b7280', padding: '10px 18px', fontSize: 14, fontWeight: 500, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer' },
  completeBtn: { background: '#0d9488', color: '#fff', padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
  submitBtn: { background: '#0F4A80', color: '#fff', padding: '11px 28px', marginTop: 8, fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
  errMsg: { color: '#dc2626', fontSize: 14, padding: '12px 16px', background: '#fef2f2', borderRadius: 8, marginTop: 8 },
};

export default function ItineraryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const stopsRef = useRef(null);

  const [itinerary, setItinerary] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '', itineraryUseful: true, wouldMeetAgain: true });
  const [submitted, setSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  const loadItinerary = () => {
    api.get(`/itinerary/${id}`)
      .then((r) => setItinerary(r.data))
      .catch((err) => {
        const msg = err.response?.data?.message || err.message;
        console.error('[ItineraryPage] failed to load itinerary:', msg);
        setLoadError(msg);
      });
  };

  useEffect(() => { loadItinerary(); }, [id]);

  const matchId = itinerary?.match?._id || itinerary?.match;
  const matchStatus = itinerary?.match?.status;

  const handleMarkComplete = async () => {
    try {
      await api.patch(`/matches/${matchId}/status`);
      loadItinerary();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('[ItineraryPage] advance status error:', msg);
      alert(msg);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure? This will permanently delete this match and cannot be undone.')) return;
    try {
      await api.delete(`/matches/${matchId}`);
      navigate('/matches');
    } catch (err) {
      console.error('[ItineraryPage] delete match error:', err.response?.data || err.message);
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    setFeedbackError(null);
    try {
      await api.post('/feedback', { ...feedback, matchId });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('[ItineraryPage] feedback error:', msg);
      setFeedbackError(msg);
    }
  };

  if (loadError) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ color: '#dc2626', fontSize: 15 }}>Failed to load itinerary: {loadError}</div>
    </div>
  );

  if (!itinerary) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading itinerary...</div>
  );

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Your Shared Itinerary</h1>
      {itinerary.content && <p style={s.summary}>{itinerary.content}</p>}

      <div ref={stopsRef}>
        {itinerary.stops?.length > 0 ? (
          itinerary.stops.map((stop, i) => (
            <div key={i} style={s.stop}>
              <div style={s.stopInner}>
                {stop.time && <div style={s.time}>{stop.time}</div>}
                {stop.place && <div style={s.place}>{stop.place}</div>}
                {stop.description && <div style={s.desc}>{stop.description}</div>}
                {stop.duration && <div style={s.duration}>Duration: {stop.duration}</div>}
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>No stops found in this itinerary.</div>
        )}
      </div>

      {/* Action section — varies by match status */}
      {matchStatus === 'completed' ? (
        <>
          <div style={s.actionBox}>
            <div style={s.completedMsg}>Meetup marked complete!</div>
            <div style={s.completedSub}>Hope it was a great experience.</div>
            <div style={s.btnRow}>
              {!submitted && (
                <button style={s.primaryBtn} onClick={() => setShowFeedback((v) => !v)}>
                  {showFeedback ? 'Hide feedback' : 'Give feedback'}
                </button>
              )}
              <button style={s.secondaryBtn} onClick={() => stopsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                Review itinerary
              </button>
            </div>
          </div>

          {showFeedback && !submitted && (
            <div style={s.feedbackBox}>
              <h2 style={s.h2}>How did it go?</h2>
              <form onSubmit={handleFeedback}>
                <div style={s.row}>
                  <div>
                    <label style={s.label}>Rating (1–5)</label>
                    <select value={feedback.rating} onChange={(e) => setFeedback({ ...feedback, rating: Number(e.target.value) })}>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={s.label}>Comment</label>
                  <textarea rows={3} value={feedback.comment} onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })} />
                </div>
                <div style={s.row}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    <input type="checkbox" checked={feedback.itineraryUseful} onChange={(e) => setFeedback({ ...feedback, itineraryUseful: e.target.checked })} style={{ width: 'auto' }} />
                    Itinerary was useful
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    <input type="checkbox" checked={feedback.wouldMeetAgain} onChange={(e) => setFeedback({ ...feedback, wouldMeetAgain: e.target.checked })} style={{ width: 'auto' }} />
                    Would meet again
                  </label>
                </div>
                {feedbackError && <div style={s.errMsg}>{feedbackError}</div>}
                <button type="submit" style={s.submitBtn}>Submit Feedback</button>
              </form>
            </div>
          )}

          {submitted && (
            <div style={{ ...s.actionBox, marginTop: 16 }}>
              <div style={{ color: '#0F4A80', fontWeight: 600 }}>Thanks for your feedback!</div>
            </div>
          )}
        </>
      ) : (
        <div style={s.actionBox}>
          <div style={s.btnRow}>
            <button style={s.completeBtn} onClick={handleMarkComplete}>Mark as completed</button>
            <button style={s.cancelBtn} onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
