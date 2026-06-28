import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatPanel from '../../components/ChatPanel';
import PlanningMap from '../../components/PlanningMap';
import ResourcePanel from '../../components/ResourcePanel';
import socket from '../../services/socket';
import SCENARIO_TEMPLATES from '../../data/scenarioTemplates';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getToken = () => sessionStorage.getItem('token');

export default function SimulationRoom({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('sessionId') || '';

  const mapRef = useRef(null);

  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [activeMode, setActiveMode] = useState('view');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [currentMarkers, setCurrentMarkers] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [submittedCadets, setSubmittedCadets] = useState(new Set());
  const [showAllSubmitted, setShowAllSubmitted] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);

  const isCadet = user?.role === 'cadet';
  const isAccessor = user?.role === 'accessor';

  // Fetch session data
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        const response = await fetch(`${API}/api/sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        if (response.ok) {
          setSession(data.session);
          let initialTime = data.session.timeLimit * 60 || 0;
          if (data.session.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(data.session.startedAt).getTime()) / 1000);
            initialTime = Math.max(0, initialTime - elapsed);
          }
          setTime(initialTime);
          setParticipants(data.session.participants || []);
          if (data.session.phase === 'completed') {
            setSessionEnded(true);
          } else if (data.session.phase !== 'waiting') {
            // Session already active — sync timer and start running
            setIsRunning(data.session.status === 'active');
            // Show briefing on first load if cadet hasn't seen it yet
            if (isCadet && data.session.status === 'active') {
              setShowBriefing(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
      }
    };
    fetchSession();

    // Join socket room
    socket.emit('joinRoom', {
      roomId: sessionId,
      chestNo: user?.chestNo || null,
      userName: user?.name || 'User'
    });

    // Listen for phase changes
    socket.on('sessionPhaseChange', (data) => {
      setSession(prev => {
        if (prev) {
          let initialTime = prev.timeLimit * 60 || 0;
          if (data.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000);
            initialTime = Math.max(0, initialTime - elapsed);
          }
          setTime(initialTime);
          return { ...prev, phase: data.phase, status: data.status, startedAt: data.startedAt };
        }
        return prev;
      });

      // Session just started (moved from waiting to any active phase)
      if (data.phase !== 'waiting' && data.phase !== 'completed') {
        setIsRunning(true);
        // Show briefing popup automatically when session begins
        if (data.phase === 'briefing' || data.phase === 'group_discussion' || data.phase === 'individual_planning') {
          setShowBriefing(true);
        }
      }

      if (data.phase === 'completed') {
        setSessionEnded(true);
        setIsRunning(false);
      }
    });

    socket.on('sessionEnded', () => {
      // Auto-submit cadet's work before showing ended screen
      if (isCadet && mapRef.current && submitStatus !== 'success') {
        const { markers, paths } = mapRef.current.getMapState();
        fetch(`${API}/api/sessions/${sessionId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify({ markers, paths, note: 'Auto-submitted: session ended by instructor' })
        }).catch(() => { });
      }
      setSessionEnded(true);
      setIsRunning(false);
    });

    socket.on('simulationStateChange', (data) => setIsRunning(data.isRunning));

    socket.on('userJoined', () => {
      // Refresh participants
      fetch(`${API}/api/sessions/${sessionId}/participants`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      }).then(r => r.json()).then(d => {
        if (d.participants) setParticipants(d.participants);
      }).catch(() => { });
    });

    // Listen for cadet submissions (instructor side)
    socket.on('cadetSubmitted', (data) => {
      setSubmittedCadets(prev => {
        const next = new Set(prev);
        next.add(data.cadetId);
        return next;
      });
    });

    return () => {
      socket.off('sessionPhaseChange');
      socket.off('sessionEnded');
      socket.off('simulationStateChange');
      socket.off('userJoined');
      socket.off('cadetSubmitted');
      socket.emit('leaveRoom', sessionId);
    };
  }, [sessionId]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (isRunning && time > 0 && session?.phase !== 'waiting') {
      interval = setInterval(() => setTime(t => t - 1), 1000);
    } else if (time === 0 && isRunning && isCadet && submitStatus !== 'success') {
      handleSubmitAnswer('timeOver');
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, time, session?.phase]);

  // Check if all cadets submitted
  useEffect(() => {
    if (isAccessor && participants.length > 0 && submittedCadets.size >= participants.length && submittedCadets.size > 0) {
      setShowAllSubmitted(true);
    }
  }, [submittedCadets, participants, isAccessor]);

  // Instructor: show time-up when timer reaches 0
  useEffect(() => {
    if (isAccessor && time === 0 && isRunning) {
      setShowTimeUp(true);
      setIsRunning(false);
    }
  }, [time, isRunning, isAccessor]);

  // Beep sound for low time
  useEffect(() => {
    if (!isCadet || !isRunning) return;
    // Beep at exactly 5:00, 3:00, 1:00, and every 10s under 1 min
    if (time === 300 || time === 180 || time === 60 || (time <= 60 && time > 0 && time % 10 === 0)) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = time <= 60 ? 880 : 660;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (e) { /* audio not available */ }
    }
  }, [time, isCadet, isRunning]);

  // Start session (accessor)
  const handleStartSession = async () => {
    try {
      const response = await fetch(`${API}/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        let initialTime = data.session.timeLimit * 60 || 0;
        if (data.session.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(data.session.startedAt).getTime()) / 1000);
          initialTime = Math.max(0, initialTime - elapsed);
        }
        setTime(initialTime);
        setIsRunning(true);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  // End session (accessor)
  const handleEndSession = async () => {
    if (!confirm('End session for all cadets? This cannot be undone.')) return;
    try {
      await fetch(`${API}/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      socket.emit('endSession', { roomId: sessionId });
      setSessionEnded(true);
      setIsRunning(false);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const toggleSimulation = () => {
    const newState = !isRunning;
    setIsRunning(newState);
    socket.emit('simulationStateChange', { roomId: sessionId, isRunning: newState });
  };

  // Submit answer (cadet)
  const handleSubmitAnswer = async (submitType = 'manual') => {
    if (!mapRef.current) return;
    setSubmitStatus('submitting');
    const { markers, paths } = mapRef.current.getMapState();
    try {
      const response = await fetch(`${API}/api/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ markers, paths, note: submitNote })
      });
      if (response.ok) {
        setSubmitStatus('success');
        // Notify instructor that this cadet submitted
        socket.emit('cadetSubmitted', { roomId: sessionId, cadetId: user?._id, chestNo: user?.chestNo });
        if (isCadet) {
          const resultStatus = submitType === 'timeOver' ? 'timeOver' : 'submitted';
          setTimeout(() => {
            navigate(`/cadet-session-results?status=${resultStatus}&sessionId=${sessionId}`);
          }, 500);
        }
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    }
  };

  // ── WAITING ROOM (cadet sees this before session starts) ──
  if (session && session.phase === 'waiting' && isCadet) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: '2rem', padding: '2rem', position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <button onClick={() => { if (onLogout) onLogout(); }} style={{
            padding: '0.5rem 1rem', background: 'var(--gray-700)', border: '1px solid var(--gray-600)',
            borderRadius: '0.4rem', color: 'var(--gray-300)', cursor: 'pointer', fontSize: '0.8rem'
          }}>Logout</button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>⏳</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--gray-100)', marginBottom: '0.5rem' }}>
            Waiting for Instructor
          </h1>
          <p style={{ color: 'var(--gray-400)', fontSize: '1rem', marginBottom: '1rem' }}>
            The session will begin once the Instructor starts it.
          </p>
        </div>

        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Session Code</p>
              <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>{session.sessionCode}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Your Chest No</p>
              <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--success)', fontFamily: 'monospace' }}>{user?.chestNo || '—'}</p>
            </div>
          </div>

          <div style={{ background: 'var(--gray-800)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Cadets Joined</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {participants.length === 0 ? (
                <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem' }}>Waiting for cadets...</p>
              ) : participants.map((p, idx) => (
                <span key={idx} style={{
                  padding: '0.3rem 0.7rem', background: 'rgba(59,130,246,0.15)', borderRadius: '1rem',
                  fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600'
                }}>
                  {p.chestNo || p.name}
                </span>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
            {session.title && <><strong>{session.title}</strong> · </>}
            ⏱ {session.timeLimit} min
          </p>
        </div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>
      </div>
    );
  }

  // ── SESSION ENDED SCREEN ──
  if (sessionEnded) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: '1.5rem', padding: '2rem'
      }}>
        <div style={{ fontSize: '5rem' }}>🏁</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gray-100)' }}>Session Ended</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: '1.1rem', maxWidth: '500px', textAlign: 'center' }}>
          {isCadet
            ? 'The session has been ended by the Instructor. Your work has been recorded.'
            : 'Session completed. You can review submissions from the Instructor Portal.'}
        </p>
        <button className="btn btn-primary" onClick={() => {
          if (isCadet && onLogout) onLogout();
          else navigate('/accessor');
        }}>
          {isCadet ? 'Exit' : 'Back to Portal'}
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--gray-400)' }}>
        Loading exercise data...
      </div>
    );
  }

  // ── ACCESSOR WAITING VIEW (sees participants joining) ──
  if (session.phase === 'waiting' && isAccessor) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--gray-100)' }}>
              {session.title || 'Session'} — <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{session.sessionCode}</span>
            </h1>
            <p style={{ color: 'var(--gray-400)' }}>Waiting for cadets to join. Share the code above.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-success" onClick={handleStartSession} disabled={participants.length === 0}
              style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
              ▶ Start Session ({participants.length} cadets)
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/accessor')}>← Back</button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '1rem' }}>Cadets Joined ({participants.length})</h2>
          {participants.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              No cadets have joined yet. Share the session code: <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '1.25rem' }}>{session.sessionCode}</strong>
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {participants.map((p, idx) => (
                <div key={idx} style={{
                  padding: '1rem', background: 'var(--gray-800)', borderRadius: '0.5rem',
                  border: '1px solid var(--gray-700)', display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), #1d4ed8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                  }}>{p.chestNo || '?'}</div>
                  <div>
                    <p style={{ color: 'var(--gray-100)', fontWeight: '600', fontSize: '0.9rem' }}>{p.name}</p>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>
                      {p.batch} · {p.cadetType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN PLANNING ROOM ──
  const template = session?.scenarioId ? SCENARIO_TEMPLATES[session.scenarioId] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* Briefing Modal */}
      {showBriefing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', boxShadow: '0 0 40px rgba(59,130,246,0.3)' }}>
            <h2 className="card-title" style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.75rem' }}>📋 Situation Briefing</h2>
            <div style={{ color: 'var(--gray-300)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              <div style={{ marginBottom: '1.5rem', background: 'var(--gray-800)', padding: '1rem', borderRadius: '0.5rem' }}>
                <strong>The Situation:</strong>
                <p style={{ marginTop: '0.5rem' }}>{session.problemDescription}</p>
              </div>
              {session.problems?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Problems:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                    {session.problems.map((p, i) => <li key={i}><span style={{ color: p.priority === 'critical' ? '#ef4444' : '#f59e0b' }}>●</span> {p.description}</li>)}
                  </ul>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><strong>Resources:</strong><ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                  {session.assignedResources?.fireTrucks > 0 && <li>🚒 {session.assignedResources.fireTrucks} Fire Trucks</li>}
                  {session.assignedResources?.volunteers > 0 && <li>👷 {session.assignedResources.volunteers} Volunteers</li>}
                  {session.assignedResources?.waterPumps > 0 && <li>💧 {session.assignedResources.waterPumps} Water Pumps</li>}
                  {session.assignedResources?.ambulance > 0 && <li>🚑 {session.assignedResources.ambulance} Ambulance</li>}
                  {session.assignedResources?.police > 0 && <li>🚓 {session.assignedResources.police} Police</li>}
                  {session.assignedResources?.citizen > 0 && <li>🚶 {session.assignedResources.citizen} Citizens</li>}
                  {session.assignedResources?.car > 0 && <li>🚗 {session.assignedResources.car} Cars</li>}
                  {session.assignedResources?.bike > 0 && <li>🚲 {session.assignedResources.bike} Bikes</li>}
                  {(session.assignedResources?.customItems || []).map((ci, idx) => (
                    <li key={idx}>📦 {ci.quantity} {ci.name}</li>
                  ))}
                </ul></div>
                <div><strong>Info:</strong><ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}><li>⏱ {session.timeLimit} min</li><li>🎖 Chest No: {user?.chestNo || 'N/A'}</li></ul></div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', fontSize: '1.1rem' }} onClick={() => setShowBriefing(false)}>🚀 Begin Planning</button>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            {submitStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}><div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div><h2 style={{ color: 'var(--success)' }}>Submitted!</h2><p style={{ color: 'var(--gray-400)' }}>Redirecting...</p></div>
            ) : (<>
              <h2 className="card-title" style={{ marginBottom: '1rem', color: 'var(--primary)' }}>📤 Submit Answer</h2>
              <p style={{ color: 'var(--gray-400)', marginBottom: '1rem', fontSize: '0.9rem' }}>Send your current map to the Instructor.</p>
              <textarea className="input" rows="3" placeholder="Reasoning (optional)..." value={submitNote} onChange={e => setSubmitNote(e.target.value)} style={{ resize: 'vertical', marginBottom: '1rem' }} />
              {submitStatus === 'error' && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>⚠ Failed. Try again.</p>}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSubmitAnswer('manual')} disabled={submitStatus === 'submitting'}>{submitStatus === 'submitting' ? '⏳...' : '📤 Confirm'}</button>
                <button className="btn btn-secondary" onClick={() => { setShowSubmitConfirm(false); setSubmitStatus(null); }}>Cancel</button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* Pause Overlay — only when truly paused, not during briefing */}
      {!isRunning && !showBriefing && !showSubmitConfirm && session?.phase !== 'waiting' && session?.phase !== 'completed' && isCadet && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏸</div>
            <h2 className="card-title" style={{ color: 'var(--warning)' }}>Session Paused</h2>
            <p style={{ color: 'var(--gray-300)' }}>Session paused by instructor, waiting for Instructor cmd.</p>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ color: 'var(--primary)', fontSize: '1.5rem', margin: 0 }}>📖 Instructions</h2>
              <button onClick={() => setShowInstructions(false)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
            </div>
            <div style={{ color: 'var(--gray-300)', fontSize: '0.85rem', lineHeight: '1.7' }}>
              {[
                { title: '🗺 Map', color: 'var(--primary)', items: ['View Mode: drag to pan, scroll to zoom', 'Select resource then click map to place', 'Draw Route: click points → Finish Route', 'Undo removes last item, Clear removes all'] },
                { title: '💬 Chat & Submit', color: 'var(--success)', items: ['Discuss plan in real-time', 'Click Submit when ready, auto-submit on timeout'] },
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: '0.75rem', padding: '0.6rem', background: 'var(--gray-800)', borderRadius: '0.4rem' }}>
                  <strong style={{ color: s.color }}>{s.title}</strong>
                  <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0 }}>{s.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => setShowInstructions(false)}>Got it!</button>
          </div>
        </div>
      )}

      {/* ══════════ CADET VIEW ══════════ */}
      {isCadet && (<>
        {/* Compact Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.75rem', background: 'rgba(5,7,10,0.95)', borderBottom: '1px solid rgba(14,165,233,0.2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '700', color: 'var(--gray-100)', fontSize: '1rem', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planning Room</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>{session.sessionCode} · Chest <strong style={{ color: 'var(--success)' }}>{user?.chestNo}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              padding: '0.15rem 0.6rem', borderRadius: '0.25rem', fontFamily: 'monospace', fontWeight: '700', fontSize: '1rem',
              background: time < 180 ? 'rgba(239,68,68,0.15)' : time < 300 ? 'rgba(245,158,11,0.12)' : 'rgba(14,165,233,0.08)',
              color: time < 180 ? 'var(--danger)' : time < 300 ? 'var(--warning)' : 'var(--primary)',
              border: `1px solid ${time < 180 ? 'rgba(239,68,68,0.3)' : time < 300 ? 'rgba(245,158,11,0.25)' : 'rgba(14,165,233,0.15)'}`,
              animation: time < 180 ? 'timerBlink 0.5s infinite' : time < 300 ? 'timerBlink 1s infinite' : 'none'
            }}>
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </div>
            <button className="btn btn-sm btn-success" onClick={() => setShowSubmitConfirm(true)} style={{ padding: '0.3rem 0.7rem' }}>📤 Submit</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowBriefing(true)} style={{ padding: '0.3rem 0.5rem' }}>📋</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowInstructions(true)} style={{ padding: '0.3rem 0.5rem' }}>📖</button>
            <button className="btn btn-sm btn-secondary" onClick={() => { if (onLogout) onLogout(); }} style={{ padding: '0.3rem 0.5rem' }}>⏏</button>
          </div>
        </div>

        {/* Map + Right Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '75% 25%', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Map */}
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <PlanningMap ref={mapRef} roomId={sessionId} activeMode={activeMode} user={user} scenarioId={session?.scenarioId} assignedResources={session?.assignedResources} onMarkersChange={setCurrentMarkers} />
          </div>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(5,10,20,0.95)', borderLeft: '1px solid rgba(14,165,233,0.12)', overflow: 'hidden' }}>
            
            {/* TOP HALF: Tools & Resources */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Map Actions */}
              <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                <p style={{ fontSize: '0.6rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: '700', letterSpacing: '0.08em' }}>Map Actions</p>
                <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveMode('view')} style={{ flex: 1, padding: '0.3rem', borderRadius: '0.2rem', border: activeMode === 'view' ? '1px solid var(--primary)' : '1px solid var(--gray-700)', background: activeMode === 'view' ? 'rgba(14,165,233,0.2)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>👁 View</button>
                  <button onClick={() => setActiveMode('draw_path')} style={{ flex: 1, padding: '0.3rem', borderRadius: '0.2rem', border: activeMode === 'draw_path' ? '1px solid var(--primary)' : '1px solid var(--gray-700)', background: activeMode === 'draw_path' ? 'rgba(14,165,233,0.2)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>✏ Mark Route</button>
                </div>
              </div>
              {/* Legend */}
              {template?.legend && (
                <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                  <p style={{ fontSize: '0.6rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: '700', letterSpacing: '0.08em' }}>Legend</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    {template.legend.map(({ color, label }, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--gray-300)' }}>
                        <div style={{ width: '0.55rem', height: '0.55rem', background: color, borderRadius: '0.1rem', flexShrink: 0 }} /><span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Resources */}
              <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                <p style={{ fontSize: '0.6rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: '700', letterSpacing: '0.08em' }}>Resources (Select to Place)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem' }}>
                  {[
                    { k: 'add_truck', i: '🚒', l: 'Trucks', mx: session?.assignedResources?.fireTrucks || 0 },
                    { k: 'add_person', i: '👷', l: 'Volunteers', mx: session?.assignedResources?.volunteers || 0 },
                    { k: 'add_pump', i: '💧', l: 'Pumps', mx: session?.assignedResources?.waterPumps || 0 },
                    { k: 'add_ambulance', i: '🚑', l: 'Ambulance', mx: session?.assignedResources?.ambulance || 0 },
                    { k: 'add_police', i: '🚓', l: 'Police', mx: session?.assignedResources?.police || 0 },
                    { k: 'add_citizen', i: '🚶', l: 'Citizens', mx: session?.assignedResources?.citizen || 0 },
                    { k: 'add_car', i: '🚗', l: 'Cars', mx: session?.assignedResources?.car || 0 },
                    { k: 'add_bike', i: '🚲', l: 'Bikes', mx: session?.assignedResources?.bike || 0 },
                    ...(session?.assignedResources?.customItems || []).map(ci => ({
                      k: `add_custom_${ci.name}`, i: '📦', l: ci.name.substring(0,8), mx: ci.quantity
                    }))
                  ].filter(r => r.mx > 0).map(r => {
                    const used = currentMarkers.filter(m => m.type === r.k).length;
                    const rem = Math.max(0, r.mx - used);
                    const isSelected = activeMode === r.k;
                    return (
                      <button key={r.k} onClick={() => setActiveMode(r.k)} style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.35rem', 
                        borderRadius: '0.2rem', cursor: 'pointer', border: 'none', textAlign: 'left',
                        background: isSelected ? 'rgba(14,165,233,0.2)' : 'var(--gray-800)',
                        boxShadow: isSelected ? 'inset 0 0 0 1px var(--primary)' : 'inset 0 0 0 1px var(--gray-700)'
                      }}>
                        <span style={{ fontSize: '0.65rem', color: isSelected ? 'white' : 'var(--gray-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.i} {r.l}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: rem === 0 ? 'var(--danger)' : 'var(--success)', fontFamily: 'monospace', marginLeft: '0.2rem' }}>{rem}/{r.mx}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTTOM HALF: Chat */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderTop: '2px solid rgba(14,165,233,0.15)' }}>
              <ChatPanel roomId={sessionId} user={user} />
            </div>
          </div>
        </div>
      </>)}

      {/* Timer blink keyframes */}
      <style>{`@keyframes timerBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      {/* ═══ Instructor: Time's Up Overlay ═══ */}
      {showTimeUp && isAccessor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏰</div>
            <h2 className="card-title" style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>Time's Up!</h2>
            <p style={{ color: 'var(--gray-300)', marginBottom: '1rem' }}>Timer has ended. Cadet solutions have been auto-submitted.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { setShowTimeUp(false); navigate(`/accessor`); }}>📥 Check Submissions</button>
              <button className="btn btn-danger" onClick={() => { setShowTimeUp(false); handleEndSession(); }}>🏁 End Session</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ All Cadets Submitted Popup ═══ */}
      {showAllSubmitted && isAccessor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 className="card-title" style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>All Cadets Submitted!</h2>
            <p style={{ color: 'var(--gray-300)', marginBottom: '1rem' }}>All {participants.length} cadet(s) have submitted their solutions. You can review submissions and end the session.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { setShowAllSubmitted(false); }}>Continue Monitoring</button>
              <button className="btn btn-danger" onClick={() => { setShowAllSubmitted(false); handleEndSession(); }}>🏁 End Session</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ACCESSOR VIEW ══════════ */}
      {isAccessor && (<>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.75rem', background: 'rgba(5,7,10,0.95)', borderBottom: '1px solid rgba(14,165,233,0.2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '700', color: 'var(--gray-100)', fontSize: '0.95rem', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase' }}>Instructor Panel</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--gray-500)' }}>{session.sessionCode}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--gray-500)' }}>Submitted: <strong style={{ color: submittedCadets.size === participants.length && participants.length > 0 ? 'var(--success)' : 'var(--warning)' }}>{submittedCadets.size}/{participants.length}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ padding: '0.1rem 0.5rem', borderRadius: '0.2rem', fontFamily: 'monospace', fontWeight: '700', fontSize: '0.95rem', background: time < 300 ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.08)', color: time < 300 ? 'var(--danger)' : time < 600 ? 'var(--warning)' : 'var(--primary)' }}>
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </div>
            <button onClick={toggleSimulation} className={`btn btn-sm ${isRunning ? 'btn-danger' : 'btn-success'}`} style={{ padding: '0.25rem 0.6rem' }}>{isRunning ? '⏸' : '▶'}</button>
            <button className="btn btn-sm btn-danger" onClick={handleEndSession} style={{ padding: '0.25rem 0.6rem' }}>🏁 End</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowBriefing(true)} style={{ padding: '0.25rem 0.4rem' }}>📋</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '75% 25%', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ overflow: 'hidden', position: 'relative', minHeight: 0, borderRight: '1px solid rgba(14,165,233,0.15)' }}>
            <PlanningMap ref={mapRef} roomId={sessionId} activeMode="view" user={user} scenarioId={session?.scenarioId} assignedResources={session?.assignedResources} onMarkersChange={setCurrentMarkers} readOnly={true} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(5,10,20,0.95)', overflow: 'hidden' }}>
            
            {/* TOP HALF: Info Panels */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Resources compact */}
              <div style={{ padding: '0.35rem 0.5rem', borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                <p style={{ fontSize: '0.55rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: '700' }}>Resources Used</p>
                {[
                  { k: 'add_truck', i: '🚒', l: 'Trucks', mx: session?.assignedResources?.fireTrucks || 0 },
                  { k: 'add_person', i: '👷', l: 'Volunteers', mx: session?.assignedResources?.volunteers || 0 },
                  { k: 'add_pump', i: '💧', l: 'Pumps', mx: session?.assignedResources?.waterPumps || 0 },
                  { k: 'add_ambulance', i: '🚑', l: 'Ambulance', mx: session?.assignedResources?.ambulance || 0 },
                  { k: 'add_police', i: '🚓', l: 'Police', mx: session?.assignedResources?.police || 0 },
                  { k: 'add_citizen', i: '🚶', l: 'Citizens', mx: session?.assignedResources?.citizen || 0 },
                  { k: 'add_car', i: '🚗', l: 'Cars', mx: session?.assignedResources?.car || 0 },
                  { k: 'add_bike', i: '🚲', l: 'Bikes', mx: session?.assignedResources?.bike || 0 },
                  ...(session?.assignedResources?.customItems || []).map(ci => ({
                    k: `add_custom_${ci.name}`, i: '📦', l: ci.name, mx: ci.quantity
                  }))
                ].filter(r => r.mx > 0).map(r => {
                  const used = currentMarkers.filter(m => m.type === r.k).length;
                  return <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', padding: '0.1rem 0', color: 'var(--gray-300)' }}><span>{r.i} {r.l}</span><span style={{ fontFamily: 'monospace', fontWeight: '700', color: used >= r.mx ? 'var(--danger)' : 'var(--success)' }}>{used}/{r.mx}</span></div>;
                })}
              </div>
              {/* Cadets — show who submitted */}
              <div style={{ padding: '0.35rem 0.5rem', borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                <p style={{ fontSize: '0.55rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: '700' }}>Cadets ({participants.length})</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                  {participants.map((p, idx) => {
                    const hasSubmitted = submittedCadets.has(p._id);
                    return <span key={idx} style={{ padding: '0.08rem 0.4rem', borderRadius: '1rem', fontSize: '0.6rem', fontWeight: '600', background: hasSubmitted ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.15)', color: hasSubmitted ? 'var(--success)' : 'var(--primary)', textDecoration: hasSubmitted ? 'line-through' : 'none' }}>{hasSubmitted ? '✓ ' : ''}{p.chestNo || p.name}</span>;
                  })}
                </div>
              </div>
            </div>

            {/* BOTTOM HALF: Chat */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderTop: '2px solid rgba(14,165,233,0.15)' }}>
              <ChatPanel roomId={sessionId} user={user} />
            </div>
          </div>
        </div>
      </>)}
    </div>
  );
}
