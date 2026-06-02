import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SOCKET_URL = 'http://localhost:5001';

const relativeTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const TOAST_KEYFRAMES = `
  @keyframes toast-in  { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes toast-out { from { transform: translateX(0);    opacity: 1; } to { transform: translateX(110%); opacity: 0; } }
`;

const styles = {
  nav: { background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'relative', zIndex: 100 },
  brand: { color: '#0A2F5C', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' },
  links: { display: 'flex', gap: 24, alignItems: 'center' },
  link: { color: '#6b7280', fontSize: 14, fontWeight: 500 },

  // Bell
  bellWrap: { position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' },
  badge: { position: 'absolute', top: -6, right: -6, background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },

  // Avatar
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#0F4A80', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', border: '2px solid transparent' },
  avatarOpen: { width: 36, height: 36, borderRadius: '50%', background: '#0F4A80', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', border: '2px solid #2E9DC8' },

  // Shared dropdown
  dropdownWrap: { position: 'relative' },
  dropdown: (width) => ({ position: 'absolute', top: 44, right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(10,47,92,0.12)', border: '1px solid #f3f4f6', width, zIndex: 200 }),

  // Notification dropdown
  notifHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f3f4f6' },
  notifTitle: { fontWeight: 700, fontSize: 14, color: '#0A2F5C' },
  markAllBtn: { fontSize: 12, color: '#0d9488', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  notifItem: (read) => ({ padding: '12px 16px', borderBottom: '1px solid #f9fafb', cursor: 'pointer', background: read ? '#fff' : '#f0f7ff', display: 'block', width: '100%', textAlign: 'left', border: 'none', fontFamily: 'inherit' }),
  notifMsg: { fontSize: 13, color: '#0A2F5C', fontWeight: 500, lineHeight: 1.45, marginBottom: 3 },
  notifTime: { fontSize: 11, color: '#9ca3af' },
  notifEmpty: { padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#9ca3af' },

  // Toast
  toast: (exiting) => ({
    position: 'fixed', top: 80, right: 24, zIndex: 9999,
    background: '#fff', borderRadius: 10, borderLeft: '4px solid #2E9DC8',
    boxShadow: '0 4px 24px rgba(10,47,92,0.14)',
    padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
    maxWidth: 360, minWidth: 260,
    animation: exiting ? 'toast-out 0.3s ease-in forwards' : 'toast-in 0.35s ease-out forwards',
  }),
  toastMsg: { flex: 1, fontSize: 13, color: '#0A2F5C', fontWeight: 500, lineHeight: 1.5 },
  toastX: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0, alignSelf: 'center' },

  // Profile dropdown
  section: { padding: '12px 16px', borderBottom: '1px solid #f3f4f6' },
  userName: { fontWeight: 700, fontSize: 14, color: '#0A2F5C', letterSpacing: '-0.01em' },
  userEmail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  editRow: { display: 'flex', gap: 6, marginTop: 10 },
  editInput: { flex: 1, padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1.5px solid #e5e7eb', fontFamily: 'inherit' },
  saveBtn: { background: '#0F4A80', color: '#fff', padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer' },
  editLink: { fontSize: 12, color: '#0d9488', fontWeight: 600, cursor: 'pointer', marginTop: 6, display: 'inline-block', background: 'none', border: 'none', padding: 0 },
  logoutItem: { padding: '10px 16px', fontSize: 14, color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', display: 'block', borderTop: '1px solid #f3f4f6', marginTop: 4 },
  savedMsg: { fontSize: 12, color: '#0d9488', fontWeight: 600, marginTop: 6 },
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join('');
};

export default function Navbar() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null); // 'notifications' | 'profile' | null
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [toastExiting, setToastExiting] = useState(false);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const autoDismissRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stable user identity string — avoids reconnecting the socket when user
  // properties change (e.g. trust score updates) vs. when the user actually changes.
  const userId = user?._id?.toString?.() || user?.id || null;

  // Load notifications + connect socket when user identity is available
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem('token');

    api.get('/notifications').then((r) => {
      setNotifications(r.data);
      setUnreadCount(r.data.filter((n) => !n.read).length);
    }).catch(() => {});

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Navbar] socket connected, id:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Navbar] socket connect_error:', err.message);
    });

    socket.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setToastQueue((prev) => [...prev, { id: notif._id || Date.now(), message: notif.message }]);
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [userId]);

  // Dequeue the next toast whenever the current one finishes
  useEffect(() => {
    if (toast !== null || toastQueue.length === 0) return;
    const [next, ...rest] = toastQueue;
    setToastQueue(rest);
    setToast(next);
    setToastExiting(false);
  }, [toast, toastQueue]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!toast || toastExiting) return;
    autoDismissRef.current = setTimeout(() => {
      setToastExiting(true);
      setTimeout(() => { setToast(null); setToastExiting(false); }, 320);
    }, 4000);
    return () => clearTimeout(autoDismissRef.current);
  }, [toast, toastExiting]);

  const handleDismissToast = () => {
    clearTimeout(autoDismissRef.current);
    setToastExiting(true);
    setTimeout(() => { setToast(null); setToastExiting(false); }, 320);
  };

  const handleBellClick = () => {
    setOpenDropdown((prev) => prev === 'notifications' ? null : 'notifications');
    setEditing(false);
  };

  const handleAvatarClick = () => {
    setOpenDropdown((prev) => prev === 'profile' ? null : 'profile');
    setEditing(false);
    setSaved(false);
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      await api.patch(`/notifications/${notif._id}/read`).catch(() => {});
      setNotifications((prev) => prev.map((n) => n._id === notif._id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setOpenDropdown(null);
    navigate('/matches');
  };

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleOpenEdit = () => {
    setNameInput(user?.name || '');
    setEditing(true);
    setSaved(false);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === user?.name) { setEditing(false); return; }
    try {
      const res = await api.patch('/auth/profile', { name: nameInput.trim() });
      updateUser({ name: res.data.name });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to update name:', err.message);
    }
  };

  const handleLogout = () => {
    setOpenDropdown(null);
    logout();
    navigate('/');
  };

  return (
    <>
    <style>{TOAST_KEYFRAMES}</style>
    {toast && (
      <div style={styles.toast(toastExiting)}>
        <span style={styles.toastMsg}>{toast.message}</span>
        <button style={styles.toastX} onClick={handleDismissToast} aria-label="Dismiss">×</button>
      </div>
    )}
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>Detour</Link>
      <div style={styles.links} ref={containerRef}>
        {user ? (
          <>
            <Link to="/activities" style={styles.link}>Browse</Link>
            <Link to="/my-posts" style={styles.link}>My Posts</Link>
            <Link to="/matches" style={styles.link}>My Matches</Link>

            {/* Bell */}
            <div style={styles.dropdownWrap}>
              <div style={styles.bellWrap} onClick={handleBellClick}>
                <BellIcon />
                {unreadCount > 0 && (
                  <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>

              {openDropdown === 'notifications' && (
                <div style={styles.dropdown(320)}>
                  <div style={styles.notifHeader}>
                    <span style={styles.notifTitle}>Notifications</span>
                    {unreadCount > 0 && (
                      <button style={styles.markAllBtn} onClick={handleMarkAllRead}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={styles.notifEmpty}>No notifications yet.</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button key={n._id} style={styles.notifItem(n.read)} onClick={() => handleNotifClick(n)}>
                        <div style={styles.notifMsg}>{n.message}</div>
                        <div style={styles.notifTime}>{relativeTime(n.createdAt)}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile avatar */}
            <div style={styles.dropdownWrap}>
              <div
                style={openDropdown === 'profile' ? styles.avatarOpen : styles.avatar}
                onClick={handleAvatarClick}
              >
                {getInitials(user.name)}
              </div>

              {openDropdown === 'profile' && (
                <div style={styles.dropdown(240)}>
                  <div style={styles.section}>
                    <div style={styles.userName}>{user.name}</div>
                    <div style={styles.userEmail}>{user.email}</div>
                    {saved && <div style={styles.savedMsg}>Name updated.</div>}
                    {!editing && !saved && (
                      <button style={styles.editLink} onClick={handleOpenEdit}>Edit name</button>
                    )}
                    {editing && (
                      <div style={styles.editRow}>
                        <input
                          autoFocus
                          style={styles.editInput}
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditing(false); }}
                          placeholder="Your name"
                        />
                        <button style={styles.saveBtn} onClick={handleSaveName}>Save</button>
                      </div>
                    )}
                  </div>
                  <button style={styles.logoutItem} onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </nav>
    </>
  );
}
