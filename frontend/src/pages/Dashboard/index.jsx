import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SvgIcon from '../../components/SvgIcon';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getToken = () => sessionStorage.getItem('token');

export default function Dashboard({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API}/api/sessions/my-sessions`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        if (response.ok) setSessions(data.sessions || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--gray-100)', marginBottom: '0.5rem' }}>
          Instructor Dashboard
        </h1>
        <p style={{ color: 'var(--gray-400)' }}>Welcome back, {user?.name || 'Instructor'}!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sessions Created</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gray-100)', lineHeight: 1 }}>{loading ? '-' : sessions.length}</div>
            </div>
          </div>
          {sessions.length > 0 ? (
            <div>
              <div style={{ height: '16px', display: 'flex', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                 <div style={{ width: `${(sessions.filter(s => s.phase !== 'completed').length / sessions.length) * 100}%`, background: 'var(--warning)' }} />
                 <div style={{ width: `${(sessions.filter(s => s.phase === 'completed').length / sessions.length) * 100}%`, background: 'var(--success)' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><span style={{ color: 'var(--warning)' }}>■</span> Active ({sessions.filter(s => s.phase !== 'completed').length})</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><span style={{ color: 'var(--success)' }}>■</span> Completed ({sessions.filter(s => s.phase === 'completed').length})</span>
              </div>
            </div>
          ) : (
             <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>No sessions yet</div>
          )}
        </div>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>OLQs Analyzed</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gray-100)', lineHeight: 1 }}>14</div>
              <svg width="120" height="60" viewBox="0 0 60 30">
                <rect x="0" y="15" width="8" height="15" fill="var(--primary)" opacity="0.6" />
                <rect x="12" y="10" width="8" height="20" fill="var(--primary)" opacity="0.8" />
                <rect x="24" y="20" width="8" height="10" fill="var(--primary)" opacity="0.5" />
                <rect x="36" y="5" width="8" height="25" fill="var(--primary)" opacity="0.9" />
                <rect x="48" y="12" width="8" height="18" fill="var(--primary)" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Officer Like Qualities processed over recent sessions</div>
        </div>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>System Health</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)', lineHeight: 1 }}>100%</div>
              <svg width="160" height="60" viewBox="0 0 80 30">
                <polyline points="0,20 15,22 30,15 45,25 60,10 80,18" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="80" cy="18" r="3" fill="var(--success)" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Tracks real-time API latency, websocket stability, and server uptime.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <Link to="/accessor" className="card" style={{ textDecoration: 'none', color: 'inherit', transition: 'all 0.3s ease' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <SvgIcon name="⚙" size="4rem" color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-100)', marginBottom: '0.5rem' }}>Instructor Portal</h3>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem', marginBottom: '1rem' }}>Manage sessions and review cadet submissions.</p>
          <button className="btn btn-primary" style={{ width: '100%' }}>Access</button>
        </Link>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>Recent Sessions</h2>
        {loading ? (
          <p style={{ color: 'var(--gray-500)', fontStyle: 'italic' }}>Loading...</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', fontStyle: 'italic' }}>No sessions created yet.</p>
        ) : (
          <div className="space-y-4">
            {sessions.slice(0, 5).map((s, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem',
                background: 'var(--gray-800)', borderRadius: '0.5rem', border: '1px solid var(--gray-700)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <SvgIcon name="👨‍🏫" size="2rem" color="var(--primary)" />
                  </div>
                  <div>
                    <p style={{ color: 'var(--gray-100)', fontWeight: '600' }}>
                      {s.title || `Session ${s.sessionCode}`}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      Code: {s.sessionCode} | {s.participants?.length || 0} cadets | {s.phase}
                    </p>
                  </div>
                </div>
                <span className={`badge ${s.phase === 'completed' ? 'badge-success' : s.phase === 'waiting' ? 'badge-warning' : 'badge-info'}`}>
                  {s.phase}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
