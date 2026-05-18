import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  nav: { background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  brand: { color: '#0A2F5C', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' },
  links: { display: 'flex', gap: 24, alignItems: 'center' },
  link: { color: '#6b7280', fontSize: 14, fontWeight: 500 },
  btn: { background: '#0F4A80', color: '#fff', padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em' },
  outlineBtn: { background: 'transparent', color: '#0f0f0f', padding: '8px 20px', fontSize: 14, fontWeight: 500, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>Detour</Link>
      <div style={styles.links}>
        {user ? (
          <>
            <Link to="/activities" style={styles.link}>Activities</Link>
            <Link to="/matches" style={styles.link}>My Matches</Link>
            <button style={styles.btn} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.outlineBtn}>Sign In</Link>
            <Link to="/register"><button style={styles.btn}>Get Started</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
