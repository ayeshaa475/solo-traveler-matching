import React, { useEffect, useState } from 'react';
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
  completedMsg: { fontSize: 22, fontWeight: 800, color: '#0A2F5C', marginBottom: 6, letterSpacing: '-0.01em' },
  completedSub: { fontSize: 14, color: '#6b7280' },
  btnRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  cancelBtn: { background: 'transparent', color: '#6b7280', padding: '10px 18px', fontSize: 14, fontWeight: 500, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer' },
  completeBtn: { background: '#0d9488', color: '#fff', padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' },
  errMsg: { color: '#dc2626', fontSize: 14, padding: '12px 16px', background: '#fef2f2', borderRadius: 8, marginTop: 8 },
  cancelConfirm: { marginTop: 12, padding: '14px 16px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' },
  cancelQuestion: { fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 10 },
  cancelConfirmRow: { display: 'flex', gap: 8 },
  yesCancelBtn: { background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  keepBtn: { background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', cursor: 'pointer' },
};

export default function ItineraryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [itinerary, setItinerary] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [markCompleteError, setMarkCompleteError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState(null);

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
    setMarkCompleteError(null);
    try {
      await api.patch(`/matches/${matchId}/status`);
      loadItinerary();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('[ItineraryPage] advance status error:', msg);
      setMarkCompleteError(msg);
    }
  };

  const handleCancel = async () => {
    setCancelError(null);
    try {
      await api.delete(`/matches/${matchId}`);
      navigate('/matches');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('[ItineraryPage] delete match error:', msg);
      setCancelError(msg);
      setShowCancelConfirm(false);
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

      <div>
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
          </div>

</>
      ) : (
        <div style={s.actionBox}>
          {markCompleteError && <div style={s.errMsg}>{markCompleteError}</div>}
          <div style={s.btnRow}>
            <button style={s.completeBtn} onClick={handleMarkComplete}>Mark as completed</button>
            <button style={s.cancelBtn} onClick={() => setShowCancelConfirm(true)}>Cancel</button>
          </div>
          {showCancelConfirm && (
            <div style={s.cancelConfirm}>
              <div style={s.cancelQuestion}>Are you sure? This will permanently delete this match and cannot be undone.</div>
              <div style={s.cancelConfirmRow}>
                <button style={s.yesCancelBtn} onClick={handleCancel}>Yes, cancel</button>
                <button style={s.keepBtn} onClick={() => setShowCancelConfirm(false)}>Keep it</button>
              </div>
              {cancelError && <div style={s.errMsg}>{cancelError}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
