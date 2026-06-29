import { useState } from 'react';
import SvgIcon from '../../components/SvgIcon';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const BATCH_OPTIONS = [
  'NDA-156', 'NDA-157', 'NDA-158',
  'CDS-134', 'CDS-135', 'CDS-136',
  'CAPF-2025', 'CAPF-2026',
  'SSB-Direct', 'TGC-40', 'UES-34'
];

export default function Login({ onAccessorLogin, onCadetJoin }) {
  const [tab, setTab] = useState('cadet'); // 'accessor' | 'cadet'

  // Accessor fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Cadet fields
  const [chestNo, setChestNo] = useState('');
  const [name, setName] = useState('');
  const [cadetType, setCadetType] = useState('fresher');
  const [batch, setBatch] = useState('NDA-156');
  const [sessionCode, setSessionCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Accessor Login ──
  const handleAccessorLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        onAccessorLogin(data.token, data.user);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Cadet Join ──
  const handleCadetJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/auth/cadet-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chestNo: chestNo.trim(),
          name: name.trim(),
          cadetType,
          batch,
          sessionCode: sessionCode.trim().toUpperCase()
        })
      });
      const data = await response.json();
      if (response.ok) {
        onCadetJoin(data.token, data.user, data.session);
      } else {
        setError(data.error || 'Failed to join session');
      }
    } catch {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const inputLabel = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--gray-400)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'var(--darker)',
    }}>
      <div className="login-container" style={{
        position: 'relative',
        width: '100%',
        maxWidth: '54rem',
        minHeight: '36rem',
        background: 'var(--gray-900)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(14, 165, 233, 0.2)',
        borderRadius: '0.75rem',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        display: 'flex',
        transition: 'all 0.5s ease',
      }}>
        {/* CSS Corner Accents (matching our tactical theme) */}
        <div className="corner-accent top-left" />
        <div className="corner-accent bottom-right" />

        {/* 1. SWITCHER OVERLAY PANEL (Slides left and right) */}
        <div className="login-switcher" style={{
          '--switcher-left': tab === 'cadet' ? '0%' : '50%',
          '--switcher-border-right': tab === 'cadet' ? '1px solid rgba(14, 165, 233, 0.3)' : 'none',
          '--switcher-border-left': tab === 'accessor' ? '1px solid rgba(14, 165, 233, 0.3)' : 'none',
        }}>
          {/* Logo and branding inside the switcher */}
          <img src="/assets/logo.png" alt="OpSim GPE" style={{ width: '4.5rem', height: '4.5rem', objectFit: 'contain', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(14, 165, 233, 0.5))' }} />
          
          {tab === 'cadet' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease', width: '100%' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--gray-50)', marginBottom: '0.5rem', textShadow: '0 0 10px rgba(14, 165, 233, 0.3)' }}>
                Cadet Entry
              </h2>
              <p style={{ color: 'var(--gray-300)', fontSize: '0.85rem', marginBottom: '2rem', maxWidth: '18rem' }}>
                Access the Tactical Group Planning Exercise platform.
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Are you an instructor?</span>
              <button className="btn btn-secondary btn-sm" onClick={() => { setTab('accessor'); setError(''); }} style={{ width: '100%', maxWidth: '12rem' }}>
                Login as Instructor
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease', width: '100%' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--gray-50)', marginBottom: '0.5rem', textShadow: '0 0 10px rgba(14, 165, 233, 0.3)' }}>
                Instructor Login
              </h2>
              <p style={{ color: 'var(--gray-300)', fontSize: '0.85rem', marginBottom: '2rem', maxWidth: '18rem' }}>
                Evaluate, configure, and monitor tactical exercise simulations.
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Are you a cadet?</span>
              <button className="btn btn-secondary btn-sm" onClick={() => { setTab('cadet'); setError(''); }} style={{ width: '100%', maxWidth: '12rem' }}>
                Login as Cadet
              </button>
            </div>
          )}
        </div>

        {/* 2. INSTRUCTOR FORM CONTAINER (Left half) */}
        <div className={`form-container-left ${tab !== 'accessor' ? 'inactive' : ''}`} style={{
          opacity: tab === 'accessor' ? 1 : 0.1,
          pointerEvents: tab === 'accessor' ? 'auto' : 'none',
          transform: tab === 'accessor' ? 'translateX(0)' : 'translateX(-20px)',
        }}>
          <div style={{ maxWidth: '22rem', width: '100%', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--gray-100)', fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.25rem' }}>Sign In</h3>
              <p style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>OpSim GPE Administrator Panel</p>
            </div>
            
            <form onSubmit={handleAccessorLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={inputLabel}>Email Address</label>
                <input type="email" className="input" placeholder="email@gov.in" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={inputLabel}>Password</label>
                <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {tab === 'accessor' && error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontWeight: '700', fontSize: '0.9rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading ? <><SvgIcon name="loading" className="animate-spin" /> Signing In...</> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* 3. CADET FORM CONTAINER (Right half) */}
        <div className={`form-container-right ${tab !== 'cadet' ? 'inactive' : ''}`} style={{
          opacity: tab === 'cadet' ? 1 : 0.1,
          pointerEvents: tab === 'cadet' ? 'auto' : 'none',
          transform: tab === 'cadet' ? 'translateX(0)' : 'translateX(20px)',
        }}>
          <div style={{ maxWidth: '22rem', width: '100%', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--gray-100)', fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.25rem' }}>Join Exercise</h3>
              <p style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>Group Planning Exercise Platform</p>
            </div>

            <form onSubmit={handleCadetJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div>
                  <label style={inputLabel}>Chest No.</label>
                  <input className="input" placeholder="42" value={chestNo} onChange={e => setChestNo(e.target.value)}
                    style={{ fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center', padding: '0.85rem 0.5rem' }} required />
                </div>
                <div>
                  <label style={inputLabel}>Full Name</label>
                  <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={inputLabel}>Type</label>
                  <select className="input" value={cadetType} onChange={e => setCadetType(e.target.value)}>
                    <option value="fresher">Fresher</option>
                    <option value="repeater">Repeater</option>
                  </select>
                </div>
                <div>
                  <label style={inputLabel}>Batch</label>
                  <select className="input" value={batch} onChange={e => setBatch(e.target.value)}>
                    {BATCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={inputLabel}>Session Code</label>
                <input className="input" placeholder="6-DIGIT CODE"
                  value={sessionCode} onChange={e => setSessionCode(e.target.value)}
                  maxLength={6} required
                  style={{ fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '800', fontFamily: 'monospace' }}
                />
              </div>

              {tab === 'cadet' && error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontWeight: '700', fontSize: '0.9rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading ? <><SvgIcon name="loading" className="animate-spin" /> Joining...</> : <><SvgIcon name="rocket" /> Join Exercise</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .corner-accent {
          position: absolute;
          width: 15px;
          height: 15px;
          border: 2px solid var(--primary);
          opacity: 0.7;
          pointer-events: none;
          z-index: 15;
        }
        .corner-accent.top-left {
          top: -1px;
          left: -1px;
          border-right: none;
          border-bottom: none;
        }
        .corner-accent.bottom-right {
          bottom: -1px;
          right: -1px;
          border-left: none;
          border-top: none;
        }
        
        .login-switcher {
          position: absolute;
          top: 0;
          left: var(--switcher-left);
          width: 50%;
          height: 100%;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(14, 165, 233, 0.15) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-right: var(--switcher-border-right);
          border-left: var(--switcher-border-left);
          transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          text-align: center;
        }
        
        .form-container-left {
          width: 50%;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }
        
        .form-container-right {
          width: 50%;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }
        
        @media (max-width: 768px) {
          .login-container {
            flex-direction: column;
            min-height: auto !important;
            max-width: 26rem;
          }
          .login-switcher {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            padding: 1.5rem !important;
            border: none !important;
            border-bottom: 1px solid rgba(14, 165, 233, 0.2) !important;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(14, 165, 233, 0.1) 100%) !important;
          }
          .form-container-left, .form-container-right {
            width: 100% !important;
            padding: 1.5rem !important;
            transform: none !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          .form-container-left.inactive, .form-container-right.inactive {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
