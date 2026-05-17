import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const s = {
  wrap: { maxWidth: 860, margin: '0 auto', padding: '32px 24px' },
  h1: { fontSize: 26, fontWeight: 700, color: '#1e1b4b', marginBottom: 24 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontWeight: 700, fontSize: 16, color: '#1e1b4b' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  score: { background: '#ede9fe', color: '#4f46e5', fontWeight: 700, borderRadius: 8, padding: '4px 12px', fontSize: 14 },
  matchBtn: { background: '#4f46e5', color: '#fff', fontSize: 13, padding: '8px 16px', marginTop: 12 },
  itinBtn: { background: '#10b981', color: '#fff', fontSize: 13, padding: '8px 16px', marginTop: 8 },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 16 },
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
