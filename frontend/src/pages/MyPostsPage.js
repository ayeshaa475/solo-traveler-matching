import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CATEGORY_IMAGES = {
  hiking: [
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&h=300&fit=crop',
  ],
  culture: [
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1532003885409-ed84d334f6cc?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1561839561-b13a1891ee17?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&h=300&fit=crop',
  ],
  food: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1498654896293-37aaa4f6a069?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=300&fit=crop',
  ],
  relaxation: [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1439088007595-7d0c28a8a455?w=600&h=300&fit=crop',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571406252241-db0280bd36cd?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1543353071-087092ec393a?w=600&h=300&fit=crop',
  ],
  adventure: [
    'https://images.unsplash.com/photo-1519583272095-6433daf26b6e?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&h=300&fit=crop',
  ],
  other: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&h=300&fit=crop',
  ],
};
CATEGORY_IMAGES.default = CATEGORY_IMAGES.other;

const hashIndex = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
};

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
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  h1: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 36, fontWeight: 900, color: '#0A2F5C', letterSpacing: '-0.02em' },
  addBtn: { background: '#0A2F5C', color: '#fff', padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
  },
  cardPhoto: { width: '100%', height: 160, objectFit: 'cover', display: 'block' },
  cardPhotoPlaceholder: { width: '100%', height: 160, background: 'linear-gradient(135deg, #0A2F5C 0%, #1a4a7c 60%, #0d3b6e 100%)' },
  cardContent: { padding: 24 },
  cardTitle: { fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#1a1a2e', letterSpacing: '-0.01em' },
  badge: { fontSize: 11, fontWeight: 700, color: '#1a3a5c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 },
  meta: { fontSize: 13, color: '#4a4a4a', marginBottom: 4 },
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
  trustSignal: { fontSize: 12, color: '#4a4a4a', marginTop: 2 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  deleteLink: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', padding: 0, fontFamily: 'inherit', flexShrink: 0 },
  deleteConfirm: { marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6', fontSize: 13, color: '#6b7280' },
  yesDeleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 13, fontWeight: 600, padding: '0 12px 0 0', fontFamily: 'inherit' },
  cancelDeleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, padding: 0, fontFamily: 'inherit' },
};

export default function MyPostsPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [activityMatchesMap, setActivityMatchesMap] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

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
        <div style={s.pageHeader}>
          <h1 style={s.h1}>My Posts</h1>
          <button style={s.addBtn} onClick={() => navigate('/activities', { state: { openForm: true } })}>
            + Post Activity
          </button>
        </div>
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
              const catImgs = CATEGORY_IMAGES[a.category] || CATEGORY_IMAGES.default;
              const fallbackSrc = catImgs[hashIndex(a._id) % catImgs.length];
              const placesUrl = a.photoReference
                ? `${api.defaults.baseURL}/activities/photo/${a.photoReference}`
                : null;
              const errorStage = imgErrors[a._id]; // undefined | 'places' | 'all'
              const imgSrc = errorStage === 'places' ? fallbackSrc
                : errorStage === 'all' ? null
                : (placesUrl || fallbackSrc);
              const handleImgError = () => setImgErrors((prev) => ({
                ...prev,
                [a._id]: (!prev[a._id] && placesUrl) ? 'places' : 'all',
              }));
              return (
                <div key={a._id} style={s.card}>
                  {imgSrc
                    ? <img src={imgSrc} style={s.cardPhoto} alt={a.category} onError={handleImgError} />
                    : <div style={s.cardPhotoPlaceholder} />
                  }
                  <div style={s.cardContent}>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
