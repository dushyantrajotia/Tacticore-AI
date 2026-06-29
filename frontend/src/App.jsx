import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SimulationRoom from './pages/SimulationRoom';
import AccessorPortal from './pages/AccessorPortal';
import CadetSessionResults from './pages/CadetSessionResults';
import SvgIcon from './components/SvgIcon';

// ── Token helpers (sessionStorage only — no localStorage) ──
const getToken = () => sessionStorage.getItem('token');
const setToken = (token) => sessionStorage.setItem('token', token);
const clearToken = () => sessionStorage.removeItem('token');

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cadetSession, setCadetSession] = useState(null); // session info when cadet joins

  // On mount, check if we have a token and fetch user from server
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetch(`${API}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data.user))
        .catch(() => { clearToken(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAccessorLogin = (token, userData) => {
    setToken(token);
    setUser(userData);
  };

  const handleCadetJoin = (token, userData, sessionInfo) => {
    setToken(token);
    setUser(userData);
    setCadetSession(sessionInfo);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setCadetSession(null);
  };

  // Global logout listener
  useEffect(() => {
    const onAppLogout = () => handleLogout();
    window.addEventListener('app-logout', onAppLogout);
    return () => window.removeEventListener('app-logout', onAppLogout);
  }, []);

  // Theme initialization
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--gray-500)' }}>
        Connecting to server...
      </div>
    );
  }

  const isAuth = !!user;
  const role = user?.role || '';

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {isAuth && role === 'accessor' && <Navbar onLogout={handleLogout} user={user} />}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isAuth && role === 'accessor' ? '1rem 1.5rem' : '0', width: '100%', overflow: 'auto', minHeight: 0 }}>
          <Routes>
            {/* Login — shows accessor login + cadet join */}
            <Route
              path="/"
              element={
                isAuth
                  ? <Navigate to={role === 'accessor' ? '/accessor' : `/simulation?sessionId=${cadetSession?._id || ''}`} replace />
                  : <Login onAccessorLogin={handleAccessorLogin} onCadetJoin={handleCadetJoin} />
              }
            />

            {/* Accessor routes */}
            <Route path="/dashboard" element={isAuth && role === 'accessor' ? <Dashboard user={user} /> : <Navigate to="/" replace />} />
            <Route path="/accessor" element={isAuth && role === 'accessor' ? <AccessorPortal user={user} /> : <Navigate to="/" replace />} />

            {/* Simulation — both roles */}
            <Route path="/simulation" element={isAuth ? <SimulationRoom user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />} />

            {/* Cadet results */}
            <Route path="/cadet-session-results" element={isAuth && role === 'cadet' ? <CadetSessionResults onLogout={handleLogout} /> : <Navigate to="/" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Global Theme Toggle */}
        <button onClick={toggleTheme} style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: 'var(--gray-800)', border: '1px solid var(--gray-600)',
          borderRadius: '50%', width: '3rem', height: '3rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '1.5rem', transition: 'all 0.2s',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          color: theme === 'dark' ? 'var(--warning)' : 'var(--primary)'
        }} title="Toggle Theme">
          {theme === 'dark' ? <SvgIcon name="sun" size="1.2rem" /> : <SvgIcon name="moon" size="1.2rem" />}
        </button>
      </div>
    </Router>
  );
}
