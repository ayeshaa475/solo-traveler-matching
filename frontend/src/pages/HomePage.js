import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BOKEH_KEYFRAMES = `
  @keyframes bokeh-drift-1 {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(40px, -30px) scale(1.06); }
    66%  { transform: translate(-20px, 35px) scale(0.96); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes bokeh-drift-2 {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(-35px, 42px) scale(1.1); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes bokeh-drift-3 {
    0%   { transform: translate(0, 0) scale(1); }
    40%  { transform: translate(28px, -38px) scale(0.93); }
    80%  { transform: translate(-12px, 22px) scale(1.04); }
    100% { transform: translate(0, 0) scale(1); }
  }
`;

const NAVY = '#0A2F5C';

const bokehCircles = [
  { size: 440, top: '-8%',  left: '-10%', color: '#1A6FA8', opacity: 0.09, blur: 90,  anim: 'bokeh-drift-1 22s ease-in-out infinite' },
  { size: 520, top: '38%',  right: '-12%', color: '#2E9DC8', opacity: 0.07, blur: 110, anim: 'bokeh-drift-2 28s ease-in-out infinite' },
  { size: 340, top: '58%',  left: '8%',   color: '#dbeafe', opacity: 0.055, blur: 80, anim: 'bokeh-drift-3 19s ease-in-out infinite' },
  { size: 260, top: '4%',   right: '14%', color: '#2E9DC8', opacity: 0.07, blur: 70,  anim: 'bokeh-drift-1 25s ease-in-out infinite reverse' },
  { size: 190, top: '72%',  right: '22%', color: '#bfdbfe', opacity: 0.07, blur: 55,  anim: 'bokeh-drift-2 20s ease-in-out infinite reverse' },
];

const steps = [
  {
    num: '01',
    title: 'Post an Activity',
    desc: "Share what you want to do, whether it's a hike, a food tour, or a museum visit, and when you want to do it.",
  },
  {
    num: '02',
    title: 'Get Matched',
    desc: 'The app scores other solo travelers in the same city by shared interests and timing, then surfaces the best fits.',
  },
  {
    num: '03',
    title: 'Get a day plan',
    desc: 'Once matched, you both get a shared, customizable itinerary with specific venues, times, and logistics tailored to your interests.',
  },
  {
    num: '04',
    title: 'Rate Your Experience',
    desc: 'Rate the experience after. Every rating helps improve your future matches.',
  },
];

const s = {
  page: { background: '#ffffff' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '0 24px',
    minHeight: '100vh',
    background: NAVY,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  h1: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 80,
    fontWeight: 900,
    color: '#ffffff',
    marginBottom: 28,
    lineHeight: 1.0,
    letterSpacing: '-0.02em',
  },
  sub: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 18,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 1.75,
    maxWidth: 500,
    fontWeight: 400,
    textAlign: 'center',
    margin: '0 auto 52px',
  },
  btnGroup: { display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  primaryBtn: {
    background: '#ffffff',
    color: '#0A2F5C',
    padding: '16px 40px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },
  outlineBtn: {
    background: 'transparent',
    color: '#ffffff',
    padding: '16px 40px',
    fontSize: 16,
    fontWeight: 500,
    borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.75)',
    cursor: 'pointer',
  },

  // ── Steps ─────────────────────────────────────────────────────────────────
  stepSection: () => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    padding: '0 120px',
  }),
  stepLeft: {
    flex: '0 0 40%',
    paddingRight: 48,
  },
  stepRight: {
    flex: '0 0 40%',
    paddingLeft: 48,
  },
  stepTitle: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 68,
    fontWeight: 900,
    color: NAVY,
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
  },
  stepDesc: {
    fontSize: 19,
    color: NAVY,
    lineHeight: 1.85,
    fontWeight: 400,
    opacity: 0.62,
  },

};

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div style={s.page}>
      <style>{BOKEH_KEYFRAMES}</style>

      {/* ── Dark navy hero ── */}
      <div style={s.hero}>
        {bokehCircles.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: c.size,
              height: c.size,
              borderRadius: '50%',
              background: c.color,
              opacity: c.opacity,
              filter: `blur(${c.blur}px)`,
              animation: c.anim,
              top: c.top,
              left: c.left,
              right: c.right,
              pointerEvents: 'none',
            }}
          />
        ))}

        <div style={s.heroContent}>
          <h1 style={s.h1}>Travel solo.<br />Explore together.</h1>
          <p style={s.sub}>
            Connect with other travelers in the same city.
          </p>
          {!user ? (
            <div style={s.btnGroup}>
              <Link to="/activities"><button style={s.primaryBtn}>Browse Activities</button></Link>
              <Link to="/register"><button style={s.outlineBtn}>Sign Up</button></Link>
            </div>
          ) : (
            <Link to="/activities"><button style={s.primaryBtn}>Browse Activities</button></Link>
          )}
        </div>
      </div>

      {/* ── How It Works ── */}
      {steps.map((step) => (
        <div key={step.num} style={s.stepSection()}>
          <div style={s.stepLeft}>
            <h2 style={s.stepTitle}>{step.title}</h2>
          </div>
          <div style={s.stepRight}>
            <p style={s.stepDesc}>{step.desc}</p>
          </div>
        </div>
      ))}

    </div>
  );
}
