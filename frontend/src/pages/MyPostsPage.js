import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const s = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  h1: { fontSize: 28, fontWeight: 800, color: '#0A2F5C', marginBottom: 28, letterSpacing: '-0.02em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', border: '1px solid #f3f4f6' },
  cardTitle: { fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#0A2F5C', letterSpacing: '-0.01em' },
  badge: { display: 'inline-block', background: '#E8F5E3', color: '#0F4A80', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, marginBottom: 10 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  viewMatchBtn: { background: '#1A6FA8', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', marginTop: 14, borderRadius: 7, border: 'none', cursor: 'pointer' },
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
  empty: { color: '#6b7280', fontSize: 14 },
};

export default function MyPostsPage() {
  const { user: currentUser } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [activityMatchesMap, setActivityMatchesMap] = useState({});

  useEffect(() => {
    api.get('/activities/mine').then((r) => setMyPosts(r.data));
  }, []);

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
    <div style={s.wrap}>
      <h1 style={s.h1}>My Posts</h1>
      {myPosts.length === 0 && <div style={s.empty}>You haven't posted any activities yet.</div>}
      <div style={s.grid}>
        {myPosts.map((a) => {
          const isExpanded = expandedActivity === a._id;
          const matches = activityMatchesMap[a._id];
          return (
            <div key={a._id} style={s.card}>
              <span style={s.badge}>{a.category}</span>
              <div style={s.cardTitle}>{a.title}</div>
              <div style={s.meta}>{a.city} · {new Date(a.date).toLocaleDateString()}</div>
              {a.description && <div style={{ ...s.meta, marginTop: 8 }}>{a.description}</div>}
              <button style={s.viewMatchBtn} onClick={() => handleViewMatches(a._id)}>
                {isExpanded ? 'Hide Matches' : 'View Matches'}
              </button>

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
    </div>
  );
}
