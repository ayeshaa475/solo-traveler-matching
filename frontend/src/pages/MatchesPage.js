import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = 'http://localhost:5001';

const PULSE_KEYFRAMES = `@keyframes btn-pulse { 0%,100% { opacity: 0.85; } 50% { opacity: 0.5; } }`;

const s = {
  wrap: { maxWidth: 860, margin: '0 auto', padding: '40px 24px' },
  h1: { fontSize: 28, fontWeight: 800, color: '#0A2F5C', marginBottom: 24, letterSpacing: '-0.02em' },
  card: { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', marginBottom: 16, border: '1px solid #f3f4f6' },
  name: { fontWeight: 700, fontSize: 16, color: '#0A2F5C', letterSpacing: '-0.01em' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  itinBtn:        { background: '#1A6FA8', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  generatingBtn:  { background: '#1A6FA8', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'not-allowed', animation: 'btn-pulse 1.4s ease-in-out infinite' },
  acceptBtn:   { background: '#0d9488', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  confirmBtn:  { background: '#0F4A80', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  completeBtn: { background: '#0d9488', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  disabledBtn:  { background: '#e5e7eb', color: '#9ca3af', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'not-allowed' },
  cancelBtn:   { background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '8px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', cursor: 'pointer' },
  declineBtn:  { background: 'transparent', color: '#dc2626', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 7, border: '1.5px solid #fecaca', cursor: 'pointer' },
  btnRow: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' },
  statusBadge: (status) => ({
    display: 'inline-block',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
    borderRadius: 6, padding: '3px 10px', marginTop: 8,
    background: status === 'completed' ? '#E8F5E3' : status === 'confirmed' ? '#dbeafe' : '#f3f4f6',
    color: status === 'completed' ? '#0F4A80' : status === 'confirmed' ? '#1d4ed8' : '#6b7280',
  }),
  awaitingBadge: {
    display: 'inline-block',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
    borderRadius: 6, padding: '3px 10px', marginTop: 8,
    background: '#fef3c7', color: '#92400e',
  },
  cancelConfirm: {
    marginTop: 14, padding: '14px 16px', background: '#fef2f2',
    borderRadius: 10, border: '1px solid #fecaca',
  },
  cancelQuestion: { fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 10 },
  cancelConfirmRow: { display: 'flex', gap: 8 },
  yesCancelBtn: { background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  keepBtn:      { background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', cursor: 'pointer' },
  errMsg: { color: '#dc2626', fontSize: 13, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, marginTop: 8, border: '1px solid #fecaca' },
  trustSignal: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
};

export default function MatchesPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [myMatches, setMyMatches] = useState([]);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [advanceError, setAdvanceError] = useState(null);
  const [generatingMatchId, setGeneratingMatchId] = useState(null);
  const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState(new Set());
  const socketRef = useRef(null);

  const loadMyMatches = () => {
    api.get('/matches/my')
      .then((r) => {
        const seen = new Set();
        const deduped = r.data.filter((match) => {
          const participantKey = (match.participants || []).map((p) => String(p._id)).sort().join('-');
          const key = `${match.activity?._id}-${participantKey}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setMyMatches(deduped);
      })
      .catch((err) => console.error('[MatchesPage] /matches/my error:', err));
  };

  useEffect(() => { loadMyMatches(); }, []);

  useEffect(() => {
    const completed = myMatches.filter((m) => m.status === 'completed');
    if (!completed.length || !currentUser) return;
    const myId = String(currentUser?._id || currentUser?.id);
    Promise.all(
      completed.map((m) =>
        api.get(`/feedback/${m._id}`)
          .then((r) => ({ matchId: m._id, feedbacks: r.data }))
          .catch(() => ({ matchId: m._id, feedbacks: [] }))
      )
    ).then((results) => {
      const submitted = new Set();
      results.forEach(({ matchId, feedbacks }) => {
        if (feedbacks.some((f) => String(f.submittedBy?._id || f.submittedBy) === myId)) {
          submitted.add(matchId);
        }
      });
      setSubmittedFeedbackIds(submitted);
    });
  }, [myMatches, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('match_updated', (updatedMatch) => {
      setMyMatches((prev) =>
        prev.map((match) =>
          match._id === updatedMatch._id ? { ...match, ...updatedMatch } : match
        )
      );
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [currentUser]);

  const getRole = (match) => {
    const myId = String(currentUser?._id || currentUser?.id);
    const isOwner = String(match.activity?.user?._id || match.activity?.user) === myId;
    const isInitiator = String(match.initiator?._id || match.initiator) === myId;
    return { isOwner, isInitiator };
  };

  const handleAdvanceStatus = async (matchId) => {
    setAdvanceError(null);
    try {
      await api.patch(`/matches/${matchId}/status`);
      loadMyMatches();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('Advance status failed:', msg);
      setAdvanceError(msg);
    }
  };

  const handleDelete = async (matchId) => {
    try {
      await api.delete(`/matches/${matchId}`);
      setPendingCancel(null);
      loadMyMatches();
    } catch (err) {
      console.error('Delete match failed:', err.response?.data || err.message);
    }
  };

  const getItineraryId = (itinerary) => {
    if (!itinerary) return null;
    if (typeof itinerary === 'string') return itinerary;
    if (itinerary._id) return itinerary._id.toString();
    return String(itinerary);
  };

  const handleGenerateItinerary = async (match) => {
    const existingId = getItineraryId(match.itinerary);
    if (existingId) { navigate(`/itinerary/${existingId}`); return; }
    setGeneratingMatchId(match._id);
    try {
      const res = await api.post(`/itinerary/generate/${match._id}`);
      const itineraryId = getItineraryId(res.data);
      if (!itineraryId) { console.error('No itinerary ID in response:', res.data); return; }
      navigate(`/itinerary/${itineraryId}`, { state: { city: match.activity?.city } });
    } catch (err) {
      console.error('Generate itinerary failed:', err.response?.status, err.response?.data || err.message);
    } finally {
      setGeneratingMatchId(null);
    }
  };

  const renderMatchButtons = (match) => {
    const itineraryId = getItineraryId(match.itinerary);
    const { status, _id: matchId } = match;
    const showCancelConfirm = pendingCancel === matchId;
    const { isOwner } = getRole(match);

    if (status === 'completed') {
      const feedbackDone = submittedFeedbackIds.has(matchId);
      return (
        <div style={s.btnRow}>
          {itineraryId && (
            <button style={s.itinBtn} onClick={() => navigate(`/itinerary/${itineraryId}`)}>
              View Itinerary
            </button>
          )}
          <button
            style={feedbackDone ? s.disabledBtn : s.confirmBtn}
            onClick={feedbackDone ? undefined : () => navigate(`/feedback/${matchId}`)}
            disabled={feedbackDone}
          >
            {feedbackDone ? 'Feedback Submitted' : 'Share Feedback'}
          </button>
        </div>
      );
    }

    if (status === 'confirmed') {
      const isGenerating = generatingMatchId === matchId;
      return (
        <div>
          <div style={s.btnRow}>
            <button
              style={isGenerating ? s.generatingBtn : s.itinBtn}
              onClick={() => handleGenerateItinerary(match)}
              disabled={isGenerating}
            >
              {isGenerating ? 'Creating your itinerary...' : itineraryId ? 'View Itinerary' : 'Plan Itinerary'}
            </button>
            <button style={s.completeBtn} onClick={() => handleAdvanceStatus(matchId)}>Mark as completed</button>
          </div>
          <div style={{ ...s.btnRow, marginTop: 8 }}>
            <button style={s.cancelBtn} onClick={() => setPendingCancel(matchId)}>Cancel</button>
            {showCancelConfirm && (
              <div style={s.cancelConfirm}>
                <div style={s.cancelQuestion}>Are you sure you want to cancel this match?</div>
                <div style={s.cancelConfirmRow}>
                  <button style={s.yesCancelBtn} onClick={() => handleDelete(matchId)}>Yes, cancel</button>
                  <button style={s.keepBtn} onClick={() => setPendingCancel(null)}>Keep it</button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // pending — activity owner sees Accept + Decline
    if (isOwner) {
      return (
        <div>
          <div style={s.btnRow}>
            <button style={s.acceptBtn} onClick={() => handleAdvanceStatus(matchId)}>Accept</button>
            <button style={s.declineBtn} onClick={() => setPendingCancel(matchId)}>Decline</button>
          </div>
          {showCancelConfirm && (
            <div style={s.cancelConfirm}>
              <div style={s.cancelQuestion}>Decline this match request?</div>
              <div style={s.cancelConfirmRow}>
                <button style={s.yesCancelBtn} onClick={() => handleDelete(matchId)}>Yes, decline</button>
                <button style={s.keepBtn} onClick={() => setPendingCancel(null)}>Keep it</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // pending — initiator sees awaiting state + cancel option
    return (
      <div style={s.btnRow}>
        <button style={s.cancelBtn} onClick={() => setPendingCancel(matchId)}>Cancel request</button>
        {showCancelConfirm && (
          <div style={s.cancelConfirm}>
            <div style={s.cancelQuestion}>Cancel this match request?</div>
            <div style={s.cancelConfirmRow}>
              <button style={s.yesCancelBtn} onClick={() => handleDelete(matchId)}>Yes, cancel</button>
              <button style={s.keepBtn} onClick={() => setPendingCancel(null)}>Keep it</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={s.wrap}>
      <style>{PULSE_KEYFRAMES}</style>
      <h1 style={s.h1}>My Matches</h1>
      {advanceError && <div style={s.errMsg}>{advanceError}</div>}
      {myMatches.length === 0 && (
        <div style={{ color: '#6b7280' }}>No matches yet. Browse activities and connect with travelers!</div>
      )}
      {myMatches.map((match) => {
        const { isInitiator } = getRole(match);
        const showAwaitingBadge = match.status === 'pending' && isInitiator;
        return (
          <div key={match._id} style={s.card}>
            <div style={s.name}>{match.activity?.title}</div>
            <div style={s.meta}>{match.activity?.city} · {match.activity && new Date(match.activity.date).toLocaleDateString()}</div>
            <div style={s.meta}>With: {match.participants?.filter((p) => {
              const myId = currentUser?._id || currentUser?.id;
              return String(p._id) !== String(myId);
            }).map((p) => p.name).join(', ')}</div>
            {(() => {
              const myId = currentUser?._id || currentUser?.id;
              const other = match.participants?.find((p) => String(p._id) !== String(myId));
              if (!other) return null;
              return other.completedMeetups
                ? <div style={s.trustSignal}>★ {(other.averageRating || 0).toFixed(1)} · {other.completedMeetups} meetup{other.completedMeetups !== 1 ? 's' : ''}</div>
                : <div style={s.trustSignal}>New traveler</div>;
            })()}
            {showAwaitingBadge
              ? <div style={s.awaitingBadge}>Awaiting response...</div>
              : <div style={s.statusBadge(match.status)}>{match.status}</div>
            }
            {renderMatchButtons(match)}
          </div>
        );
      })}
    </div>
  );
}
