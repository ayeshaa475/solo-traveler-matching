import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MapPinIcon = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 20 }}>
    <circle cx="36" cy="36" r="36" fill="#E8F5E3" />
    <path d="M36 18C28.268 18 22 24.268 22 32c0 12 14 22 14 22s14-10 14-22c0-7.732-6.268-14-14-14z" fill="#bfdbfe" stroke="#0F4A80" strokeWidth="1.5" />
    <circle cx="36" cy="32" r="5" fill="#2E9DC8" />
  </svg>
);

const EmptyState = ({ title, sub }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', textAlign: 'center' }}>
    <MapPinIcon />
    <div style={{ fontWeight: 700, fontSize: 18, color: '#0A2F5C', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</div>
    <div style={{ fontSize: 14, color: '#9ca3af', maxWidth: 320, lineHeight: 1.6 }}>{sub}</div>
  </div>
);

const s = {
  page: { background: '#ffffff', minHeight: '100vh', paddingTop: 60 },
  wrap: { maxWidth: 800, margin: '0 auto', padding: '40px 48px' },
  h1: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 36, fontWeight: 900, color: '#0A2F5C', marginBottom: 28, letterSpacing: '-0.02em' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: '#fff',
    borderRadius: 6,
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
  },
  cardTitle: { fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#0A2F5C', letterSpacing: '-0.01em' },
  badge: { fontSize: 11, fontWeight: 700, color: '#0A2F5C', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, opacity: 0.45 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  viewMatchBtn: { background: '#0A2F5C', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', marginTop: 14, borderRadius: 7, border: 'none', cursor: 'pointer' },
  matchList: { marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 14 },
  matchEntry: { padding: '10px 0', borderBottom: '1px solid #f9fafb' },
  matchName: { fontWeight: 600, fontSize: 14, color: '#0A2F5C', marginBottom: 3 },
  matchInterests: { fontSize: 12, color: '#6b7280' },
  statusPill: (status) => ({
    display: 'inline-block',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', borderRadius: 6, padding: '2px 8px', marginLeft: 8,
    background: status === 'completed' ? '#E8F5E3' : status === 'confirmed' ? '#dbeafe' : '#f3f4f6',
    color: status === 'completed' ? '#0F4A80' : status === 'confirmed' ? '#1d4ed8' : '#6b7280',
  }),
  noMatches: { fontSize: 13, color: '#9ca3af', marginTop: 8 },
  trustSignal: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  deleteLink: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', padding: 0, fontFamily: 'inherit', flexShrink: 0 },
  deleteConfirm: { marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6', fontSize: 13, color: '#6b7280' },
  yesDeleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 13, fontWeight: 600, padding: '0 12px 0 0', fontFamily: 'inherit' },
  cancelDeleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, padding: 0, fontFamily: 'inherit' },
};

export default function MyPostsPage() {
  const { user: currentUser } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [activityMatchesMap, setActivityMatchesMap] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    api.get('/activities/mine')
      .then((r) => setMyPosts(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (activityId) => {
    try {
      await api.delete(`/activities/${activityId}`);
      setMyPosts((prev) => prev.filter((p) => p._id !== activityId));
      setPendingDelete(null);
    } catch (err) {
      console.error('Failed to delete activity:', err.message);
    }
  };

  const handleViewMatches = async (activityId) => {
    if (expandedActivity === activityId) {
      setExpandedActivity(null);
      return;
    }
    setExpandedActivity(activityId);
    if (!activityMatchesMap[activityId]) {
      try {
        const res = await api.get(`/matches/activity/${activityId}`);
        setActivityMatchesMap((prev) => ({ ...prev, [activityId]: res.data }));
      } catch (err) {
        console.error('Failed to load activity matches:', err.message);
        setActivityMatchesMap((prev) => ({ ...prev, [activityId]: [] }));
      }
    }
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>My Posts</h1>
        {loading ? (
          <div style={{ fontSize: 14, color: '#9ca3af', padding: '40px 0' }}>Loading...</div>
        ) : myPosts.length === 0 ? (
          <EmptyState
            title="No activities posted yet"
            sub="Share what you want to do and find a travel companion to explore with!"
          />
        ) : (
          <div style={s.list}>
            {myPosts.map((a) => {
              const isExpanded = expandedActivity === a._id;
              const matches = activityMatchesMap[a._id];
              return (
                <div key={a._id} style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={s.badge}>{a.category}</div>
                    <button style={s.deleteLink} onClick={() => setPendingDelete(pendingDelete === a._id ? null : a._id)}>
                      Delete
                    </button>
                  </div>
                  <div style={s.cardTitle}>{a.title}</div>
                  <div style={s.meta}>{a.city} · {new Date(a.date).toLocaleDateString()}</div>
                  {a.description && <div style={{ ...s.meta, marginTop: 8 }}>{a.description}</div>}
                  <button style={s.viewMatchBtn} onClick={() => handleViewMatches(a._id)}>
                    {isExpanded ? 'Hide Matches' : 'View Matches'}
                  </button>

                  {pendingDelete === a._id && (
                    <div style={s.deleteConfirm}>
                      Delete this post?{' '}
                      <button style={s.yesDeleteBtn} onClick={() => handleDelete(a._id)}>Yes, delete</button>
                      <button style={s.cancelDeleteBtn} onClick={() => setPendingDelete(null)}>Cancel</button>
                    </div>
                  )}

                  {isExpanded && (
                    <div style={s.matchList}>
                      {!matches && <div style={{ fontSize: 13, color: '#6b7280' }}>Loading...</div>}
                      {matches && matches.length === 0 && (
                        <div style={s.noMatches}>No matches yet for this activity.</div>
                      )}
                      {matches && matches.map((match) => {
                        const userId = currentUser?._id || currentUser?.id;
                        const other = match.participants?.find((p) => String(p._id) !== String(userId));
                        return (
                          <div key={match._id} style={s.matchEntry}>
                            <div style={s.matchName}>
                              {other?.name || 'Unknown traveler'}
                              <span style={s.statusPill(match.status)}>{match.status}</span>
                            </div>
                            {other && (
                              other.completedMeetups
                                ? <div style={s.trustSignal}>★ {(other.averageRating || 0).toFixed(1)} · {other.completedMeetups} meetup{other.completedMeetups !== 1 ? 's' : ''}</div>
                                : <div style={s.trustSignal}>New traveler</div>
                            )}
                            {other?.interests?.length > 0 && (
                              <div style={s.matchInterests}>{other.interests.join(', ')}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
