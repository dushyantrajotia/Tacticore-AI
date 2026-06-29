import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SvgIcon from '../../components/SvgIcon';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getToken = () => sessionStorage.getItem('token');

export default function CadetSessionResults({ onLogout }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const status = queryParams.get('status'); // 'submitted' | 'timeOver'
  const sessionId = queryParams.get('sessionId');

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API}/api/sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        if (response.ok) {
          setSessionData(data.session);
        }
      } catch (err) {
        console.error('Failed to fetch session data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    else window.dispatchEvent(new Event('app-logout'));
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', color: 'var(--gray-400)'
      }}>
        Loading...
      </div>
    );
  }

  const isSubmitted = status === 'submitted';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '2rem', gap: '2rem', position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <button onClick={handleLogout} style={{
          padding: '0.5rem 1rem', background: 'var(--gray-700)', border: '1px solid var(--gray-600)',
          borderRadius: '0.4rem', color: 'var(--gray-300)', cursor: 'pointer', fontSize: '0.875rem'
        }}>Logout</button>
      </div>

      <div className="card" style={{
        maxWidth: '600px', width: '100%', textAlign: 'center', padding: '3rem 2rem',
        background: isSubmitted
          ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))',
        border: isSubmitted ? '2px solid rgba(16,185,129,0.3)' : '2px solid rgba(239,68,68,0.3)'
      }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          {isSubmitted ? <SvgIcon name="success" size="5rem" color="var(--success)" /> : <SvgIcon name="timer" size="5rem" color="var(--danger)" />}
        </div>
        <h1 style={{
          fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem',
          color: isSubmitted ? 'var(--success)' : 'var(--danger)'
        }}>
          {isSubmitted ? 'Solution Submitted' : 'Time Over'}
        </h1>
        <p style={{ color: 'var(--gray-300)', fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: '1.6' }}>
          {isSubmitted
            ? 'Your solution has been submitted to the Instructor for review.'
            : 'The time limit has ended. Your solution was automatically submitted.'}
        </p>

        {sessionData && (
          <div style={{ background: 'var(--gray-800)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Session Code: <strong style={{ color: 'var(--primary)' }}>{sessionData.sessionCode}</strong>
            </p>
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 'bold' }} onClick={handleLogout}>
          Exit
        </button>
      </div>
    </div>
  );
}
