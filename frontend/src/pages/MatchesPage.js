import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const s = {
  wrap: { maxWidth: 860, margin: '0 auto', padding: '40px 24px' },
  h1: { fontSize: 28, fontWeight: 800, color: '#0A2F5C', marginBottom: 24, letterSpacing: '-0.02em' },
  card: { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(10,47,92,0.06)', marginBottom: 16, border: '1px solid #f3f4f6' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontWeight: 700, fontSize: 16, color: '#0A2F5C', letterSpacing: '-0.01em' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  score: { background: '#E8F5E3', color: '#0F4A80', fontWeight: 700, borderRadius: 8, padding: '4px 12px', fontSize: 14 },
  matchBtn: { background: '#0F4A80', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', marginTop: 14, borderRadius: 7, border: 'none', cursor: 'pointer' },
  itinBtn: { background: '#1A6FA8', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', marginTop: 10, borderRadius: 7, border: 'none', cursor: 'pointer' },
  section: { marginBottom: 48 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 16, letterSpacing: '-0.01em' },
};

export default function MatchesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activityId = searchParams.get('activityId');
  const [candidates, setCandidates] = useState([]);
  const [myMatches, setMyMatches] = useState([]);

  useEffect(() => {
    api.get('/matches/my').then((r) => setMyMatches(r.data));
    if (activityId) {
      api.get(`/matches/find/${activityId}`).then((r) => setCandidates(r.data));
    }
  }, [activityId]);

  const handleMatch = async (candidate) => {
    await api.post('/matches', { activityId, targetUserId: candidate.activity.user._id });
    navigate('/matches');
  };

  const handleGenerateItinerary = async (matchId) => {
    const res = await api.post(`/itinerary/generate/${matchId}`);
    navigate(`/itinerary/${res.data._id}`);
  };

  return (
    <div style={s.wrap}>
      {activityId && candidates.length > 0 && (
        <div style={s.section}>
          <h1 style={s.h1}>Suggested Matches</h1>
          {candidates.map(({ activity, matchScore, sharedInterests }) => (
            <div key={activity._id} style={s.card}>
              <div style={s.row}>
                <div>
                  <div style={s.name}>{activity.user?.name}</div>
                  <div style={s.meta}>{activity.title} · {activity.city}</div>
                  <div style={s.meta}>{new Date(activity.date).toLocaleDateString()}</div>
                  {sharedInterests.length > 0 && (
                    <div style={s.meta}>Shared interests: {sharedInterests.join(', ')}</div>
                  )}
                </div>
                <span style={s.score}>{matchScore} pts</span>
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
            <div style={s.meta}>With: {match.participants?.map((p) => p.name).join(', ')}</div>
            <div style={s.meta}>Status: {match.status}</div>
            {!match.itinerary ? (
              <button style={s.itinBtn} onClick={() => handleGenerateItinerary(match._id)}>
                Generate AI Itinerary
              </button>
            ) : (
              <button style={s.itinBtn} onClick={() => navigate(`/itinerary/${match.itinerary}`)}>
                View Itinerary
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
