import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const s = {
  wrap: { maxWidth: 700, margin: '0 auto', padding: '32px 24px' },
  h1: { fontSize: 26, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 },
  summary: { color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 32 },
  stop: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '4px solid #4f46e5' },
  time: { fontWeight: 700, color: '#4f46e5', fontSize: 14, marginBottom: 4 },
  place: { fontWeight: 700, fontSize: 16, color: '#1e1b4b', marginBottom: 4 },
  desc: { fontSize: 14, color: '#6b7280', lineHeight: 1.6 },
  duration: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  feedbackBox: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: 32 },
  h2: { fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  row: { display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
  submitBtn: { background: '#4f46e5', color: '#fff', padding: '10px 24px', marginTop: 8 },
};

export default function ItineraryPage() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '', itineraryUseful: true, wouldMeetAgain: true });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/itinerary/${id}`).then((r) => setItinerary(r.data));
  }, [id]);

  const handleFeedback = async (e) => {
    e.preventDefault();
    await api.post('/feedback', { ...feedback, matchId: itinerary.match._id || itinerary.match });
    setSubmitted(true);
  };

  if (!itinerary) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading itinerary...</div>;

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Your Shared Itinerary</h1>
      <p style={s.summary}>{itinerary.content}</p>

      {itinerary.stops?.map((stop, i) => (
        <div key={i} style={s.stop}>
          <div style={s.time}>{stop.time}</div>
          <div style={s.place}>{stop.place}</div>
          <div style={s.desc}>{stop.description}</div>
          {stop.duration && <div style={s.duration}>Duration: {stop.duration}</div>}
        </div>
      ))}

      <div style={s.feedbackBox}>
        <h2 style={s.h2}>How did it go?</h2>
        {submitted ? (
          <div style={{ color: '#10b981', fontWeight: 600 }}>Thanks for your feedback!</div>
        ) : (
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
            <button type="submit" style={s.submitBtn}>Submit Feedback</button>
          </form>
        )}
      </div>
    </div>
  );
}
