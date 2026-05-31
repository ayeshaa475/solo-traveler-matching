import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { maxWidth: 860, margin: '0 auto', padding: '40px 24px' },
  h1: { fontSize: 28, fontWeight: 800, color: '#0A2F5C', marginBottom: 24, letterSpacing: '-0.02em' },
  card: { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', marginBottom: 16, border: '1px solid #f3f4f6' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontWeight: 700, fontSize: 16, color: '#0A2F5C', letterSpacing: '-0.01em' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  bestMatch: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0d9488', marginBottom: 8 },
  matchBtn: { background: '#0F4A80', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', marginTop: 14, borderRadius: 7, border: 'none', cursor: 'pointer' },
  itinBtn: { background: '#1A6FA8', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', marginTop: 10, borderRadius: 7, border: 'none', cursor: 'pointer' },
  section: { marginBottom: 48 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 16, letterSpacing: '-0.01em' },
};

export default function MatchesPage() {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const { user: currentUser } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [myMatches, setMyMatches] = useState([]);

  useEffect(() => {
    console.log('[MatchesPage] activityId from URL params:', activityId);

    api.get('/matches/my')
      .then((r) => {
        // Deduplicate by activity + sorted participant IDs
        const seen = new Set();
        const deduped = r.data.filter((match) => {
          const participantKey = (match.participants || [])
            .map((p) => String(p._id))
            .sort()
            .join('-');
          const key = `${match.activity?._id}-${participantKey}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setMyMatches(deduped);
      })
      .catch((err) => console.error('[MatchesPage] /matches/my error:', err));

    if (activityId) {
      api.get(`/matches/find/${activityId}`)
        .then((r) => {
          console.log('[MatchesPage] /matches/find response:', r.data);
          // Backend returns sorted highest-first, so first occurrence per user is their best activity
          const seen = new Set();
          const deduped = r.data.filter(({ activity }) => {
            const userId = activity.user?._id;
            if (seen.has(userId)) return false;
            seen.add(userId);
            return true;
          });
          setCandidates(deduped);
        })
        .catch((err) => console.error('[MatchesPage] /matches/find error:', err.response?.data || err.message));
    }
  }, [activityId]);

  const handleMatch = async (candidate) => {
    await api.post('/matches', { activityId, targetUserId: candidate.activity.user._id });
    navigate('/matches');
  };

  const getItineraryId = (itinerary) => {
    if (!itinerary) return null;
    if (typeof itinerary === 'string') return itinerary;
    if (itinerary._id) return itinerary._id.toString();
    return String(itinerary);
  };

  const handleGenerateItinerary = async (match) => {
    const existingId = getItineraryId(match.itinerary);
    if (existingId) {
      navigate(`/itinerary/${existingId}`);
      return;
    }
    try {
      const res = await api.post(`/itinerary/generate/${match._id}`);
      console.log('Full response data:', JSON.stringify(res.data));
      const itineraryId = getItineraryId(res.data);
      if (!itineraryId) {
        console.error('No itinerary ID in response:', res.data);
        return;
      }
      navigate(`/itinerary/${itineraryId}`);
    } catch (err) {
      console.error('Generate itinerary failed:', err.response?.status, err.response?.data || err.message);
    }
  };

  return (
    <div style={s.wrap}>
      {activityId && candidates.length > 0 && (
        <div style={s.section}>
          <h1 style={s.h1}>Suggested Matches</h1>
          {candidates.map(({ activity, sharedInterests }, index) => (
            <div key={activity._id} style={s.card}>
              {index === 0 && <div style={s.bestMatch}>Best match</div>}
              <div style={s.row}>
                <div>
                  <div style={s.name}>{activity.user?.name}</div>
                  <div style={s.meta}>{activity.title} · {activity.city}</div>
                  <div style={s.meta}>{new Date(activity.date).toLocaleDateString()}</div>
                  {sharedInterests.length > 0 && (
                    <div style={s.meta}>Shared interests: {sharedInterests.join(', ')}</div>
                  )}
                </div>
              </div>
              <button style={s.matchBtn} onClick={() => handleMatch({ activity })}>Connect</button>
            </div>
          ))}
        </div>
      )}

      <div style={s.section}>
        <h1 style={s.h1}>My Matches</h1>
        {myMatches.length === 0 && <div style={{ color: '#6b7280' }}>No matches yet. Browse activities to find travel companions!</div>}
        {myMatches.map((match) => (
          <div key={match._id} style={s.card}>
            <div style={s.name}>{match.activity?.title}</div>
            <div style={s.meta}>{match.activity?.city} · {match.activity && new Date(match.activity.date).toLocaleDateString()}</div>
            <div style={s.meta}>With: {match.participants?.filter((p) => {
                const myId = currentUser?._id || currentUser?.id;
                return String(p._id) !== String(myId);
              }).map((p) => p.name).join(', ')}</div>
            <div style={s.meta}>Status: {match.status}</div>
            {!match.itinerary ? (
              <button style={s.itinBtn} onClick={() => handleGenerateItinerary(match)}>
                Generate Itinerary
              </button>
            ) : (
              <button style={s.itinBtn} onClick={() => navigate(`/itinerary/${getItineraryId(match.itinerary)}`)}>
                View Itinerary
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
