import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  nav: { background: '#fff', borderBottom: '1px solid #ede5df', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  brand: { color: '#1a1208', fontWeight: 700, fontSize: 18 },
  links: { display: 'flex', gap: 20, alignItems: 'center' },
  link: { color: '#6b5e52', fontSize: 14, fontWeight: 500 },
  btn: { background: '#0d9488', color: '#fff', padding: '6px 14px', fontSize: 13, borderRadius: 6, border: 'none', cursor: 'pointer' },
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
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
