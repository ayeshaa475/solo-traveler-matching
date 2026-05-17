import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  page: { background: '#fffaf7', minHeight: '100vh' },
  hero: {
    textAlign: 'center',
    padding: '100px 24px 80px',
    maxWidth: 680,
    margin: '0 auto',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#0d9488',
    marginBottom: 20,
  },
  h1: {
    fontSize: 44,
    fontWeight: 800,
    color: '#1a1208',
    marginBottom: 20,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
  },
  sub: {
    fontSize: 18,
    color: '#6b5e52',
    marginBottom: 44,
    lineHeight: 1.7,
    maxWidth: 520,
    margin: '0 auto 44px',
  },
  btnGroup: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  primary: {
    background: '#0d9488',
    color: '#fff',
    padding: '13px 32px',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  secondary: {
    background: 'transparent',
    color: '#6b5e52',
    padding: '13px 32px',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 8,
    border: '1.5px solid #d9ccc4',
    cursor: 'pointer',
  },
  featureSection: {
    padding: '80px 24px 100px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  sectionLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#0d9488',
    marginBottom: 12,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 700,
    color: '#1a1208',
    marginBottom: 48,
    letterSpacing: '-0.01em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '28px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    borderTop: '3px solid #e8ddd6',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#0d9488',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 10,
    color: '#1a1208',
  },
  cardDesc: {
    color: '#6b5e52',
    fontSize: 14,
    lineHeight: 1.65,
  },
  divider: {
    height: 1,
    background: '#ede5df',
    maxWidth: 1100,
    margin: '0 auto',
  },
};

const features = [
  {
    step: 'Step 01',
    title: 'Post an Activity',
    desc: 'Share what you want to do — a hike, a food tour, a museum, a night out — and when you want to do it.',
  },
  {
    step: 'Step 02',
    title: 'Get Matched',
    desc: 'The app finds solo travelers in the same city with compatible plans and interests, ranked by fit.',
  },
  {
    step: 'Step 03',
    title: 'AI Itinerary',
    desc: 'Once matched, get a day plan with specific venues, times, and logistics — built for both of you.',
  },
  {
    step: 'Step 04',
    title: 'Trust & Feedback',
    desc: 'Rate the experience after. Ratings build your trust score and improve who you see next time.',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div style={s.page}>
      <div style={s.hero}>
        <h1 style={s.h1}>Travel solo. Explore together.</h1>
        <p style={s.sub}>
          Post what you want to do. The app matches you with solo travelers in the same city, on the same day, with the same idea.
        </p>
        <div style={s.btnGroup}>
          {user ? (
            <Link to="/activities"><button style={s.primary}>Browse Activities</button></Link>
          ) : (
            <>
              <Link to="/register"><button style={s.primary}>Get Started</button></Link>
              <Link to="/login"><button style={s.secondary}>Sign In</button></Link>
            </>
          )}
        </div>
      </div>

      <div style={s.divider} />

      <div style={s.featureSection}>
        <div style={s.sectionLabel}>How it works</div>
        <div style={s.sectionTitle}>From post to meetup in four steps</div>
        <div style={s.grid}>
          {features.map((f) => (
            <div key={f.title} style={s.card}>
              <div style={s.stepNum}>{f.step}</div>
              <div style={s.cardTitle}>{f.title}</div>
              <div style={s.cardDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
