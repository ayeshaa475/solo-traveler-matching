import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = 'http://localhost:5001';

const LOADING_KEYFRAMES = `
  @keyframes itin-spin { to { transform: rotate(360deg); } }
  @keyframes itin-fill { 0% { width: 0%; } 100% { width: 78%; } }
`;

const s = {
  wrap: { maxWidth: 700, margin: '0 auto', padding: '40px 24px' },
  h1: { fontSize: 28, fontWeight: 800, color: '#0A2F5C', marginBottom: 8, letterSpacing: '-0.02em' },
  summary: { color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 36 },
  stop: { background: '#fff', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', border: '1px solid #f3f4f6' },
  stopInner: { borderLeft: '4px solid #0F4A80', paddingLeft: 16 },
  tealStopInner: { borderLeft: '4px solid #0d9488', paddingLeft: 16 },
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
  // Edit / revision styles
  editBtn: { background: 'transparent', color: '#0d9488', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 6, border: '1.5px solid #0d9488', cursor: 'pointer', flexShrink: 0 },
  removeBtn: { background: 'transparent', color: '#dc2626', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 6, border: '1.5px solid #fecaca', cursor: 'pointer', flexShrink: 0 },
  removingBtn: { background: 'transparent', color: '#9ca3af', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 6, border: '1.5px solid #e5e7eb', cursor: 'not-allowed', flexShrink: 0 },
  proposeBtn: { background: '#0d9488', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  proposingBtn: { background: '#e5e7eb', color: '#9ca3af', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'not-allowed' },
  acceptBtn: { background: '#0d9488', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  acceptRemoveBtn: { background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer' },
  rejectBtn: { background: 'transparent', color: '#dc2626', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 7, border: '1.5px solid #fecaca', cursor: 'pointer' },
  pendingBanner: { background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#0f766e', fontWeight: 500 },
  revisionMsg: { background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 14, color: '#0f766e', fontWeight: 600, textAlign: 'center' },
};

export default function ItineraryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: routeState } = useLocation();
  const { user: currentUser } = useAuth();
  const socketRef = useRef(null);

  const [itinerary, setItinerary] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [markCompleteError, setMarkCompleteError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Edit / revision state
  const [editingStop, setEditingStop] = useState(null);
  const [editRequest, setEditRequest] = useState('');
  const [proposing, setProposing] = useState(false);
  const [removingStop, setRemovingStop] = useState(null);
  const [proposeError, setProposeError] = useState(null);
  const [revisionMsg, setRevisionMsg] = useState(null);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('itinerary_revision_proposed', (updated) => {
      if (String(updated._id) === id) setItinerary(updated);
    });

    socket.on('itinerary_revision_resolved', ({ itinerary: updated, action }) => {
      if (String(updated._id) === id) {
        setItinerary(updated);
        setRevisionMsg(action === 'accept' ? 'Change accepted!' : 'Change rejected.');
        setTimeout(() => setRevisionMsg(null), 3000);
      }
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [id]);

  const matchId = itinerary?.match?._id || itinerary?.match;
  const matchStatus = itinerary?.match?.status;

  const myId = String(currentUser?._id || currentUser?.id || '');
  const otherParticipant = itinerary?.match?.participants?.find(
    (p) => String(p._id) !== myId
  );
  const otherName = otherParticipant?.name || 'your travel partner';

  const pr = itinerary?.pendingRevision;
  const isProposer = pr && String(pr.requested_by) === myId;
  const isReviewer = pr && !isProposer;

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

  const handlePropose = async (stopIndex) => {
    if (!editRequest.trim()) return;
    setProposeError(null);
    setProposing(true);
    try {
      const res = await api.post(`/itinerary/${id}/propose`, {
        stop_index: stopIndex,
        edit_request: editRequest,
      });
      setItinerary(res.data);
      setEditingStop(null);
      setEditRequest('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('[ItineraryPage] propose error:', msg);
      setProposeError(msg);
    } finally {
      setProposing(false);
    }
  };

  const handleProposeRemove = async (stopIndex) => {
    setProposeError(null);
    setRemovingStop(stopIndex);
    try {
      const res = await api.post(`/itinerary/${id}/propose`, {
        stop_index: stopIndex,
        edit_request: 'remove this stop entirely',
      });
      setItinerary(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('[ItineraryPage] remove propose error:', msg);
      setProposeError(msg);
    } finally {
      setRemovingStop(null);
    }
  };

  const handleRevision = async (action) => {
    const isDeletion = !pr?.proposed_stop;
    try {
      const res = await api.patch(`/itinerary/${id}/revision`, { action });
      setItinerary(res.data);
      if (action === 'accept') {
        setRevisionMsg(isDeletion ? 'Stop removed!' : 'Change accepted!');
      } else {
        setRevisionMsg('Change rejected.');
      }
      setTimeout(() => setRevisionMsg(null), 3000);
    } catch (err) {
      console.error('[ItineraryPage] revision error:', err.response?.data?.message || err.message);
    }
  };

  const renderStopContent = (stop, accentStyle) => (
    <div style={accentStyle}>
      {stop.time && <div style={s.time}>{stop.time}</div>}
      {stop.place && <div style={s.place}>{stop.place}</div>}
      {stop.description && <div style={s.desc}>{stop.description}</div>}
      {stop.duration && <div style={s.duration}>Duration: {stop.duration}</div>}
    </div>
  );

  const renderStop = (stop, i) => {
    const isPendingStop = pr && pr.stop_index === i;
    const hasPending = !!pr;
    const canEdit = matchStatus === 'confirmed' && !hasPending;
    const isEditing = editingStop === i;

    if (isPendingStop) {
      const isDeletion = !pr.proposed_stop;

      if (isDeletion) {
        return (
          <div key={i} style={{ ...s.stop, border: '1.5px solid #fecaca' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Proposed removal</div>
            <div style={{ opacity: 0.45, textDecoration: 'line-through' }}>
              {renderStopContent(pr.original_stop, s.stopInner)}
            </div>
            {isProposer && (
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 12, fontStyle: 'italic' }}>
                Waiting for {otherName} to review...
              </div>
            )}
            {isReviewer && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={s.acceptRemoveBtn} onClick={() => handleRevision('accept')}>Accept removal</button>
                <button style={s.rejectBtn} onClick={() => handleRevision('reject')}>Reject</button>
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={i} style={s.stop}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Original — greyed out */}
            <div style={{ flex: '1 1 200px', opacity: 0.45 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Original</div>
              {renderStopContent(pr.original_stop, s.stopInner)}
            </div>
            {/* Proposed — highlighted */}
            <div style={{ flex: '1 1 200px', background: '#f0fdfa', borderRadius: 10, padding: 16, border: '1.5px solid #0d9488' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Proposed change</div>
              {renderStopContent(pr.proposed_stop, s.tealStopInner)}
              {isProposer && (
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 12, fontStyle: 'italic' }}>
                  Waiting for {otherName} to review...
                </div>
              )}
              {isReviewer && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={s.acceptBtn} onClick={() => handleRevision('accept')}>Accept</button>
                  <button style={s.rejectBtn} onClick={() => handleRevision('reject')}>Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={i} style={s.stop}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ ...s.stopInner, flex: 1 }}>
            {stop.time && <div style={s.time}>{stop.time}</div>}
            {stop.place && <div style={s.place}>{stop.place}</div>}
            {stop.description && <div style={s.desc}>{stop.description}</div>}
            {stop.duration && <div style={s.duration}>Duration: {stop.duration}</div>}
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                style={s.editBtn}
                onClick={() => {
                  if (isEditing) { setEditingStop(null); setEditRequest(''); setProposeError(null); }
                  else { setEditingStop(i); setEditRequest(''); setProposeError(null); }
                }}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <button
                style={removingStop === i ? s.removingBtn : s.removeBtn}
                onClick={() => handleProposeRemove(i)}
                disabled={removingStop === i}
              >
                {removingStop === i ? '...' : 'Remove'}
              </button>
            </div>
          )}
        </div>
        {isEditing && (
          <div style={{ marginTop: 14 }}>
            <textarea
              rows={2}
              value={editRequest}
              onChange={(e) => setEditRequest(e.target.value)}
              placeholder="What would you like to change? e.g. make this later, swap for something indoors"
              style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', boxSizing: 'border-box', resize: 'vertical' }}
            />
            {proposeError && <div style={s.errMsg}>{proposeError}</div>}
            <div style={{ marginTop: 8 }}>
              <button
                style={proposing ? s.proposingBtn : s.proposeBtn}
                onClick={() => handlePropose(i)}
                disabled={proposing}
              >
                {proposing ? 'Generating...' : 'Suggest change'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loadError) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ color: '#dc2626', fontSize: 15 }}>Failed to load itinerary: {loadError}</div>
    </div>
  );

  if (!itinerary) {
    const city = routeState?.city;
    return (
      <>
        <style>{LOADING_KEYFRAMES}</style>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(10,47,92,0.10)', border: '1px solid #f3f4f6' }}>
            <div style={{ fontWeight: 800, fontSize: 24, color: '#0A2F5C', letterSpacing: '-0.02em', marginBottom: 32 }}>Detour</div>
            <div style={{ width: 48, height: 48, border: '3px solid #e0f2f1', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'itin-spin 0.9s linear infinite', margin: '0 auto 28px' }} />
            <div style={{ fontWeight: 700, fontSize: 18, color: '#0A2F5C', marginBottom: 8, letterSpacing: '-0.01em' }}>
              {city ? `Our AI is planning your day in ${city}...` : 'Our AI is crafting your itinerary...'}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32 }}>This usually takes 10–15 seconds</div>
            <div style={{ background: '#f3f4f6', borderRadius: 99, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #0d9488, #2E9DC8)', animation: 'itin-fill 12s cubic-bezier(0.15, 0, 0.3, 1) forwards' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Your Shared Itinerary</h1>
      {itinerary.content && <p style={s.summary}>{itinerary.content}</p>}

      {/* Pending revision banner */}
      {pr && matchStatus === 'confirmed' && (
        <div style={s.pendingBanner}>
          {isProposer
            ? `Waiting for ${otherName} to review your proposed change below.`
            : `${otherName} has proposed a change — see below to accept or reject.`}
        </div>
      )}
      {!pr && matchStatus === 'confirmed' && (
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
          Tap <strong>Edit</strong> on any stop to suggest a change.
        </div>
      )}

      <div>
        {itinerary.stops?.length > 0 ? (
          itinerary.stops.map((stop, i) => renderStop(stop, i))
        ) : (
          <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>No stops found in this itinerary.</div>
        )}
      </div>

      {revisionMsg && <div style={s.revisionMsg}>{revisionMsg}</div>}

      {/* Action section — varies by match status */}
      {matchStatus === 'completed' ? (
        <div style={s.actionBox}>
          <div style={s.completedMsg}>Meetup marked complete!</div>
          <div style={s.completedSub}>Hope it was a great experience.</div>
        </div>
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
