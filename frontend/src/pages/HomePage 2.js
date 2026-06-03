import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PALETTE = {
  mint:     '#E8F5E3',
  sage:     '#A8D5C2',
  teal:     '#2E9DC8',
  deepBlue: '#0F4A80',
  navy:     '#0A2F5C',
};

const s = {
  page: { background: '#ffffff', minHeight: '100vh' },

  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '140px 24px 120px',
    background: '#ffffff',
  },
  h1: {
    fontSize: 76,
    fontWeight: 800,
    color: PALETTE.navy,
    marginBottom: 28,
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
  },
  sub: {
    fontSize: 22,
    color: '#374151',
    lineHeight: 1.7,
    maxWidth: 560,
    marginBottom: 52,
    fontWeight: 500,
  },
  btnGroup: { display: 'flex', gap: 14, justifyContent: 'center' },
  primary: {
    background: PALETTE.deepBlue,
    color: '#fff',
    padding: '16px 40px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },
  secondary: {
    background: 'transparent',
    color: '#6b7280',
    padding: '16px 40px',
    fontSize: 16,
    fontWeight: 500,
    borderRadius: 10,
    border: '1.5px solid #e5e7eb',
    cursor: 'pointer',
  },

  // Steps get the gradient; CTA is separate
  gradientWrap: {
    background: `linear-gradient(to bottom, #ffffff, ${PALETTE.mint} 20%, ${PALETTE.sage} 65%, ${PALETTE.teal} 100%)`,
  },

  step: {
    padding: '120px 0',
  },
  stepInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 80,
  },
  stepLeft: { flex: '0 0 auto' },
  stepNum: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: PALETTE.navy,
    opacity: 0.5,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 56,
    fontWeight: 800,
    color: PALETTE.navy,
    letterSpacing: '-0.03em',
    lineHeight: 1.05,
    maxWidth: 420,
  },
  stepRight: { flex: '0 0 400px' },
  stepDesc: {
    fontSize: 20,
    color: PALETTE.navy,
    lineHeight: 1.8,
    fontWeight: 400,
    opacity: 0.75,
  },

  // CTA breaks back to white
  bottomCta: {
    textAlign: 'center',
    padding: '140px 24px',
    background: '#ffffff',
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: PALETTE.teal,
    marginBottom: 24,
  },
  ctaHeadline: {
    fontSize: 48,
    fontWeight: 800,
    color: PALETTE.navy,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    marginBottom: 48,
  },
  ctaBtn: {
    background: PALETTE.teal,
    color: '#fff',
    padding: '20px 56px',
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },
};

const steps = [
  {
    num: '01',
    title: 'Post an Activity',
    desc: 'Say what you want to do, a hike, a food tour, a museum, or a night out, and when you want to do it. Takes 30 seconds.',
  },
  {
    num: '02',
    title: 'Get Matched',
    desc: 'The app scores other solo travelers in the same city by shared interests and timing, then surfaces the best fits.',
  },
  {
    num: '03',
    title: 'AI Itinerary',
    desc: 'Once matched, get a day plan with specific venues, times, and logistics generated for both of you.',
  },
  {
    num: '04',
    title: 'Rate Your Experience',
    desc: 'Rate the experience after. Every rating helps improve your future matches.',
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <h1 style={s.h1}>Travel solo. Explore together.</h1>
        <p style={s.sub}>
          Connect with a solo traveler in the same city, on the same day, with the same idea.
        </p>
        {!user && (
          <div style={s.btnGroup}>
            <Link to="/register"><button style={s.primary}>Get Started</button></Link>
            <Link to="/login"><button style={s.secondary}>Sign In</button></Link>
          </div>
        )}
        {user && (
          <Link to="/activities"><button style={s.primary}>Browse Activities</button></Link>
        )}
      </div>

      <div style={s.gradientWrap}>
        {steps.map((step) => (
          <div key={step.num} style={s.step}>
            <div style={s.stepInner}>
              <div style={s.stepLeft}>
                <div style={s.stepNum}>Step {step.num}</div>
                <div style={s.stepTitle}>{step.title}</div>
              </div>
              <div style={s.stepRight}>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!user && (
        <div style={s.bottomCta}>
          <div style={s.ctaLabel}>Ready?</div>
          <div style={s.ctaHeadline}>Find someone to explore with.</div>
          <Link to="/register"><button style={s.ctaBtn}>Get Started</button></Link>
        </div>
      )}
    </div>
  );
}
