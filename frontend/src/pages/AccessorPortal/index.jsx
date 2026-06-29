import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateSessionWizard from '../../components/CreateSessionWizard';
import SCENARIO_TEMPLATES from '../../data/scenarioTemplates';
import PlanningMap from '../../components/PlanningMap';
import SvgIcon from '../../components/SvgIcon';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Reuse the element renderer from PlanningMap (simplified inline version)
function renderSubmissionElement(el, idx) {
  switch (el.type) {
    case 'zone':
      return (
        <g key={idx}>
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={8} fill={el.fill || '#7c6a4a'} opacity={0.8} />
          {el.label && <text x={el.x + el.w / 2} y={el.y + (el.labelY || -8)} textAnchor="middle" fill="#f3f4f6" fontSize="13" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'road':
      return <line key={idx} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#6b7280" strokeWidth={el.width || 18} />;
    case 'house':
      return <text key={idx} x={el.x + 20} y={el.y + 20} textAnchor="middle" fontSize="36">🏠</text>;
    case 'fire':
      return (
        <g key={idx}>
          <ellipse cx={el.x} cy={el.y} rx="18" ry="22" fill="#ff4500" opacity="0.7" />
          <ellipse cx={el.x} cy={el.y} rx="10" ry="14" fill="#ffcc00" opacity="0.8" />
          <text x={el.x} y={el.y + 7} textAnchor="middle" fontSize="20">🔥</text>
        </g>
      );
    case 'river':
      return (
        <g key={idx}>
          <path d={el.path} stroke="#1e90ff" strokeWidth="30" fill="none" opacity="0.7" strokeLinecap="round" />
          {el.label && <text x={el.labelX || 400} y={el.labelY || 200} textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="bold" transform={el.labelRotate ? `rotate(${el.labelRotate},${el.labelX},${el.labelY})` : undefined}>{el.label}</text>}
        </g>
      );
    case 'track':
      return (
        <g key={idx}>
          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#374151" strokeWidth="12" strokeDasharray="20,8" />
          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#9ca3af" strokeWidth="3" strokeDasharray="4,24" strokeDashoffset="14" />
          <text x={(el.x1 + el.x2) / 2 + 200} y={(el.y1 + el.y2) / 2 + 10} fill="#f3f4f6" fontSize="12" fontWeight="bold">TRAIN TRACK</text>
        </g>
      );
    case 'danger_zone':
      return (
        <g key={idx}>
          <ellipse cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} fill="#ef4444" opacity="0.5" />
          <text x={el.cx} y={el.cy + 4} textAnchor="middle" fontSize="11" fill="#fca5a5" fontWeight="bold">{el.label}</text>
        </g>
      );
    case 'vehicle':
      return (
        <g key={idx}>
          <text x={el.x} y={el.y} textAnchor="middle" fontSize="28">{el.icon}</text>
          {el.sublabel && <text x={el.x} y={el.y + 15} textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">{el.sublabel}</text>}
        </g>
      );
    case 'building':
      const isSch = el.label?.includes('School');
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <text y="6" textAnchor="middle" fontSize="36">{isSch ? '🏫' : '🏢'}</text>
          {el.label && <text y="-25" textAnchor="middle" fill={el.labelColor || "#ef4444"} fontSize="12" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'poi':
      return (
        <g key={idx}>
          <text x={el.x} y={el.y + 8} textAnchor="middle" fontSize="24">{el.icon}</text>
          {el.label && <text x={el.x} y={el.y + 25} textAnchor="middle" fill={el.labelColor || "#ef4444"} fontSize="10" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'label':
      return (
        <g key={idx}>
          <text x={el.x} y={el.y} textAnchor="middle" fill={el.color || '#ccc'} fontSize={el.size || 11} fontWeight="800">
            {el.text}
          </text>
        </g>
      );
    case 'start_point':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <circle r="12" fill="rgba(34,197,94,0.3)" stroke="#22c55e" strokeWidth="2" />
          <text y="25" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{el.label}</text>
        </g>
      );
    case 'end_point':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <rect x="-10" y="-10" width="20" height="20" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="2" />
          <text y="25" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{el.label}</text>
        </g>
      );
    case 'threat':
      return (
        <g key={idx}>
          <circle cx={el.x} cy={el.y} r="18" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
          <text x={el.x} y={el.y + 6} textAnchor="middle" fontSize="18">{el.icon}</text>
          {el.label && <text x={el.x} y={el.y + 28} textAnchor="middle" fill={el.labelColor || "#ef4444"} fontSize="9" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'tree_pine':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <path d="M 0 0 L 10 -20 L 20 0 Z" fill="#14532d" />
          <path d="M 2 -10 L 10 -30 L 18 -10 Z" fill="#166534" />
          <rect x="8" y="0" width="4" height="6" fill="#422006" />
        </g>
      );
    case 'tree_palm':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <path d="M 0 0 Q 5 -20 10 0 T 20 0" fill="none" stroke="#422006" strokeWidth="3" />
          <path d="M 5 -15 L -10 -25 M 5 -15 L 20 -25 M 5 -15 L 5 -35" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'boat':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <path d="M 0 0 L 30 0 L 40 -10 L -10 -10 Z" fill="#ef4444" stroke="#991b1b" />
          <rect x="5" y="-18" width="15" height="8" fill="white" />
          {el.label && <text y="-25" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'bridge':
      return (
        <g key={idx} transform={`translate(${el.x1},${el.y1})`}>
          <text y="12" textAnchor="middle" fontSize="36">🌉</text>
          {el.label && <text y="-25" textAnchor="middle" fill={el.labelColor || "#ef4444"} fontSize="12" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'vegetation':
      return (
        <g key={idx}>
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx="6" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="1" strokeDasharray="4,4" />
          {el.label && <text x={el.x + el.w / 2} y={el.y + el.h / 2 + 4} textAnchor="middle" fill="#86efac" fontSize="10">{el.label}</text>}
        </g>
      );
    case 'collapsed':
      return (
        <g key={idx}>
          <rect x={el.x} y={el.y} width="60" height="50" rx="3" fill="#78716c" stroke="#ef4444" strokeWidth="2" />
          <line x1={el.x} y1={el.y} x2={el.x + 60} y2={el.y + 50} stroke="#ef4444" strokeWidth="2" />
          <line x1={el.x + 60} y1={el.y} x2={el.x} y2={el.y + 50} stroke="#ef4444" strokeWidth="2" />
          {el.label && <text x={el.x + 30} y={el.y - 6} textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'hazard':
      return (
        <g key={idx}>
          <circle cx={el.x} cy={el.y} r="30" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,3" />
          <text x={el.x} y={el.y + 7} textAnchor="middle" fontSize="22">{el.icon}</text>
          {el.label && <text x={el.x} y={el.y + 30} textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">{el.label}</text>}
          {el.sublabel && <text x={el.x} y={el.y + 42} textAnchor="middle" fill="#f59e0b" fontSize="8">{el.sublabel}</text>}
        </g>
      );
    case 'road_blocked':
      return (
        <g key={idx}>
          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#6b7280" strokeWidth={20} />
          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="rgba(239,68,68,0.3)" strokeWidth={20} />
          {el.label && <text x={(el.x1 + el.x2) / 2 + 15} y={(el.y1 + el.y2) / 2} fill="#fca5a5" fontSize="9" fontWeight="bold">{el.label}</text>}
        </g>
      );
    default:
      return null;
  }
}

// Mini SVG map that renders a cadet's submitted markers and paths with scenario backdrop
function SubmissionMap({ markers = [], paths = [], scenarioId }) {
  const [step, setStep] = useState(-1);
  const W = 800, H = 550;
  const template = SCENARIO_TEMPLATES[scenarioId] || SCENARIO_TEMPLATES['mohi_firing_range'];

  const allActions = [
    ...markers.map(m => ({ ...m, _type: 'marker' })),
    ...paths.map(p => ({ ...p, _type: 'path' }))
  ].sort((a, b) => a.id - b.id);

  const totalSteps = allActions.length;
  const visibleActions = step === -1 || step >= totalSteps ? allActions : allActions.slice(0, step);

  const visibleMarkers = visibleActions.filter(a => a._type === 'marker');
  const visiblePaths = visibleActions.filter(a => a._type === 'path');

  const handleNext = () => setStep(prev => (prev === -1 ? totalSteps : prev) < totalSteps ? (prev === -1 ? 1 : prev + 1) : prev);
  const handlePrev = () => setStep(prev => prev === -1 ? totalSteps - 1 : prev > 0 ? prev - 1 : prev);
  const handleReset = () => setStep(0);
  const handleShowAll = () => setStep(-1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minHeight: '600px' }}>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', background: 'var(--gray-800)', padding: '0.5rem', borderRadius: '0.5rem' }}>
        <button className="btn btn-sm btn-secondary" onClick={handleReset} disabled={step === 0}>⏮ Reset</button>
        <button className="btn btn-sm btn-secondary" onClick={handlePrev} disabled={step === 0}>◀ Prev</button>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--gray-300)', minWidth: '80px', justifyContent: 'center' }}>
          Step {step === -1 ? totalSteps : step} / {totalSteps}
        </span>
        <button className="btn btn-sm btn-secondary" onClick={handleNext} disabled={step === -1 || step === totalSteps}>Next ▶</button>
        <button className="btn btn-sm btn-primary" onClick={handleShowAll} disabled={step === -1 || step === totalSteps}>⏭ Show All</button>
      </div>
      <div style={{ width: '100%', flex: 1, borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--gray-700)', display: 'flex', alignItems: 'center' }}>
        <PlanningMap 
          readOnly={true}
          scenarioId={scenarioId}
          initialMarkers={visibleMarkers}
          initialPaths={visiblePaths}
        />
      </div>
    </div>
  );
}

export default function AccessorPortal() {
  const navigate = useNavigate();
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [aiReports, setAiReports] = useState([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showAIReportModal, setShowAIReportModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [expandedSubmissionTab, setExpandedSubmissionTab] = useState('analysis');

  // Load existing sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${API}/api/sessions/my-sessions`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (response.ok) setSessions(data.sessions || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      }
    };
    fetchSessions();
  }, []);

  const handleSessionCreated = (session) => {
    setSessions([session, ...sessions]);
    setShowCreateWizard(false);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) return;
    try {
      const response = await fetch(`${API}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (response.ok) {
        setSessions(sessions.filter(s => s._id !== sessionId));
        if (selectedSession?._id === sessionId) {
          setSelectedSession(null);
          setSubmissions([]);
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleDuplicateSession = async (sessionId) => {
    try {
      const response = await fetch(`${API}/api/sessions/${sessionId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok && data.session) {
        setSessions([data.session, ...sessions]);
      } else {
        alert(data.message || 'Failed to duplicate session');
      }
    } catch (err) {
      console.error('Error duplicating session:', err);
    }
  };

  const fetchSubmissions = async (session) => {
    if (selectedSession?._id === session._id) {
      setSelectedSession(null);
      setSubmissions([]);
      setExpandedSubmission(null);
      setAiReports([]);
      return;
    }
    setSelectedSession(session);
    setLoadingSubmissions(true);
    setSubmissions([]);
    setExpandedSubmission(null);
    try {
      const response = await fetch(`${API}/api/sessions/${session._id}/submissions`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) setSubmissions(data.submissions || []);

      // Also fetch existing AI reports
      const aiResp = await fetch(`${API}/api/sessions/${session._id}/ai-report`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      const aiData = await aiResp.json();
      if (aiResp.ok) setAiReports(aiData.reports || []);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGenerateAIReport = async () => {
    if (!selectedSession) return;
    setGeneratingAI(true);
    try {
      const response = await fetch(`${API}/api/sessions/${selectedSession._id}/ai-report/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAiReports(data.reports || []);
        alert('Advanced AI Reports generated successfully!');
      } else {
        alert(data.message || 'Failed to generate AI report');
      }
    } catch (err) {
      console.error('Error generating AI report:', err);
      alert('Failed to generate AI report. Check backend logs.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Session code "${code}" copied to clipboard!`);
  };

  const renderSubmissionsInline = () => {
    if (loadingSubmissions) {
      return <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '2rem' }}>Loading submissions...</p>;
    }
    if (submissions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--gray-500)', background: 'var(--gray-900)', borderRadius: '0.5rem', marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <SvgIcon name="📭" size="3rem" color="var(--gray-600)" />
          </div>
          <p>No submissions yet. Share the code with cadets.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Code: <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.1em', background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>{selectedSession.sessionCode}</strong>
            <button className="btn btn-sm btn-secondary" onClick={() => copyCode(selectedSession.sessionCode)} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="📋" size="0.85rem" /> Copy Code</button>
          </p>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', padding: '1rem', background: 'var(--gray-900)', borderRadius: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gray-200)' }}>Submissions</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn btn-sm ${aiReports.length > 0 ? 'btn-success' : 'btn-primary'}`}
              onClick={aiReports.length > 0 ? () => setShowAIReportModal(true) : handleGenerateAIReport}
              disabled={generatingAI}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {generatingAI ? <><SvgIcon name="loading" className="animate-spin" /> Generating...</> : aiReports.length > 0 ? <><SvgIcon name="📊" /> View Advanced AI Reports</> : <><SvgIcon name="🤖" /> Generate Advanced AI Assessment</>}
            </button>
          </div>
        </div>
        {submissions.map((sub, idx) => (
          <div key={idx} style={{
            padding: '1rem', background: 'var(--gray-800)', borderRadius: '0.5rem', border: '1px solid var(--gray-700)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '2rem', height: '2rem', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '0.75rem'
                }}>{(sub.cadetName || 'C')[0].toUpperCase()}</div>
                <span style={{ color: 'var(--gray-100)', fontWeight: '600' }}>{sub.cadetName || 'Cadet'}</span>
                {sub.olqAnalysis && (
                  <span style={{ 
                    background: sub.olqAnalysis.overallScore >= 8 ? 'rgba(16,185,129,0.2)' : sub.olqAnalysis.overallScore >= 5 ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)', 
                    color: sub.olqAnalysis.overallScore >= 8 ? 'var(--success)' : sub.olqAnalysis.overallScore >= 5 ? 'var(--primary)' : 'var(--warning)', 
                    padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold' 
                  }}>
                    OLQ: {sub.olqAnalysis.overallScore}/10
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>
                  {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Just now'}
                </span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setExpandedSubmission({ sub, session: selectedSession })}
                >
                  🗺 View Map & Analysis
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.4rem 0.8rem', background: 'var(--gray-700)', borderRadius: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <SvgIcon name="📍" size="0.85rem" /> <strong>{sub.mapState?.markers?.length || 0}</strong> Resources Placed
              </div>
              <div style={{ padding: '0.4rem 0.8rem', background: 'var(--gray-700)', borderRadius: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <SvgIcon name="🛤" size="0.85rem" /> <strong>{sub.mapState?.paths?.length || 0}</strong> Routes Drawn
              </div>
            </div>

            {sub.mapState?.markers?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {(() => {
                  const counts = {};
                  sub.mapState.markers.forEach(m => {
                    const label = m.label || m.type || 'Resource';
                    counts[label] = (counts[label] || 0) + 1;
                  });
                  return Object.entries(counts).map(([label, count]) => (
                    <span key={label} style={{
                      padding: '0.2rem 0.6rem', background: 'rgba(59,130,246,0.15)',
                      borderRadius: '1rem', fontSize: '0.75rem', color: 'var(--primary)'
                    }}>{label} × {count}</span>
                  ));
                })()}
              </div>
            )}

            {sub.note && (
              <div style={{
                padding: '0.75rem', background: 'rgba(59,130,246,0.08)',
                borderLeft: '3px solid var(--primary)', borderRadius: '0 0.3rem 0.3rem 0',
                fontSize: '0.85rem', color: 'var(--gray-300)', fontStyle: 'italic'
              }}>💬 "{sub.note}"</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSessionCard = (session) => (
    <div key={session._id} style={{
      padding: '1rem', background: 'var(--gray-800)', borderRadius: '0.5rem',
      border: selectedSession?._id === session._id ? '2px solid var(--primary)' : '1px solid var(--gray-700)',
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            background: 'var(--primary)', color: 'white', padding: '0.3rem 0.8rem',
            borderRadius: '0.3rem', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.1em', fontFamily: 'monospace'
          }}>{session.sessionCode}</span>
          <button onClick={() => copyCode(session.sessionCode)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy code"><SvgIcon name="📋" size="0.95rem" /></button>
          <span style={{
            background: session.phase === 'waiting' ? 'rgba(245,158,11,0.15)' : session.phase === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
            color: session.phase === 'waiting' ? 'var(--warning)' : session.phase === 'completed' ? 'var(--success)' : 'var(--primary)',
            padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase'
          }}>{session.phase || 'waiting'}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="👥" size="0.8rem" /> {session.participants?.length || 0}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm btn-success" onClick={() => navigate(`/simulation?sessionId=${session._id}`)}>▶ Enter Session</button>
          <button className="btn btn-sm btn-primary" onClick={() => fetchSubmissions(session)}>
            {selectedSession?._id === session._id ? '📤 Hide Submissions' : '📥 Submissions'}
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleDuplicateSession(session._id)} title="Duplicate session" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="📋" size="0.8rem" /> Duplicate</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSession(session._id)} style={{ display: 'inline-flex', alignItems: 'center' }}><SvgIcon name="🗑" size="0.85rem" /></button>
        </div>
      </div>
      {session.title && (
        <p style={{ color: 'var(--gray-200)', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>{session.title}</p>
      )}
      <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>
        {session.problemDescription?.substring(0, 80)}{session.problemDescription?.length > 80 ? '...' : ''}
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--gray-500)', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="⏱" size="0.8rem" /> {session.timeLimit} min</span>
        {session.assignedResources?.fireTrucks > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="🚒" size="0.8rem" /> {session.assignedResources.fireTrucks}</span>}
        {session.assignedResources?.volunteers > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="👥" size="0.8rem" /> {session.assignedResources.volunteers}</span>}
        {session.assignedResources?.waterPumps > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="💧" size="0.8rem" /> {session.assignedResources.waterPumps}</span>}
        {session.assignedResources?.ambulance > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="🚑" size="0.8rem" /> {session.assignedResources.ambulance}</span>}
        {session.assignedResources?.police > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="🚓" size="0.8rem" /> {session.assignedResources.police}</span>}
        {session.assignedResources?.citizen > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="🚶" size="0.8rem" /> {session.assignedResources.citizen}</span>}
        {session.assignedResources?.car > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="🚗" size="0.8rem" /> {session.assignedResources.car}</span>}
        {session.assignedResources?.bike > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="🚲" size="0.8rem" /> {session.assignedResources.bike}</span>}
        {(session.assignedResources?.customItems || []).map((ci, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name={ci.name} size="0.8rem" /> {ci.name} ({ci.quantity})</span>
        ))}
        {session.difficulty && (
          <span style={{
            padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase',
            background: session.difficulty === 'hard' ? 'rgba(239,68,68,0.15)' : session.difficulty === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
            color: session.difficulty === 'hard' ? 'var(--danger)' : session.difficulty === 'medium' ? 'var(--warning)' : 'var(--success)'
          }}>{session.difficulty}</span>
        )}
      </div>

      {selectedSession?._id === session._id && renderSubmissionsInline()}
    </div>
  );

  const activeSessions = sessions.filter(s => s.phase !== 'completed');
  const completedSessions = sessions.filter(s => s.phase === 'completed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--gray-100)' }}>Manage Sessions</h1>
          <p style={{ color: 'var(--gray-400)' }}>Create exercises, share codes, and review cadet submissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateWizard(true)}>+ New Exercise Session</button>
      </div>

      {showCreateWizard && (
        <CreateSessionWizard
          onCreated={handleSessionCreated}
          onCancel={() => setShowCreateWizard(false)}
        />
      )}

      {/* Active Sessions */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>Active Sessions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activeSessions.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontStyle: 'italic' }}>No active sessions.</p>
          ) : (
            activeSessions.map(renderSessionCard)
          )}
        </div>
      </div>

      {/* Completed Sessions */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>Completed Sessions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {completedSessions.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontStyle: 'italic' }}>No completed sessions.</p>
          ) : (
            completedSessions.map(renderSessionCard)
          )}
        </div>
      </div>

      {/* ===== POPUP FOR EXPANDED SUBMISSION ===== */}
      {expandedSubmission && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column',
          padding: '2rem', animation: 'fadeIn 0.2s ease-out'
        }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>{expandedSubmission.sub.cadetName}'s Submission</h2>
                <p style={{ color: 'var(--gray-400)', margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Session: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{expandedSubmission.session.sessionCode}</span>
                  <button onClick={() => copyCode(expandedSubmission.session.sessionCode)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} title="Copy Session Code"><SvgIcon name="📋" size="0.85rem" /></button>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setShowProblemModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="📋" size="0.85rem" /> View Problem Statement</button>
                <button className="btn btn-secondary" onClick={() => setExpandedSubmission(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="✕" size="0.85rem" /> Close</button>
              </div>
           </div>
           
           <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: '0 0 75%', background: 'var(--gray-800)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--gray-700)' }}>
                 <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                   <SubmissionMap
                     markers={expandedSubmission.sub.mapState?.markers || []}
                     paths={expandedSubmission.sub.mapState?.paths || []}
                     scenarioId={expandedSubmission.session.scenarioId}
                   />
                 </div>
              </div>
              
              <div style={{ flex: '0 0 calc(25% - 1.5rem)', background: 'var(--gray-800)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--gray-700)', overflow: 'hidden' }}>
                 <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-700)', flexShrink: 0 }}>
                   <button onClick={() => setExpandedSubmissionTab('analysis')} style={{ flex: 1, padding: '0.75rem', background: expandedSubmissionTab === 'analysis' ? 'var(--gray-700)' : 'transparent', color: expandedSubmissionTab === 'analysis' ? 'white' : 'var(--gray-400)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>AI Analysis</button>
                   <button onClick={() => setExpandedSubmissionTab('log')} style={{ flex: 1, padding: '0.75rem', background: expandedSubmissionTab === 'log' ? 'var(--gray-700)' : 'transparent', color: expandedSubmissionTab === 'log' ? 'white' : 'var(--gray-400)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Action Log</button>
                 </div>
                 <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                   {expandedSubmissionTab === 'analysis' && (
                     expandedSubmission.sub.olqAnalysis ? (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gray-100)', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-700)', paddingBottom: '0.5rem' }}>
                            AI Analysis
                          </h3>
                          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))', border: '1px solid rgba(59,130,246,0.3)', padding: '1rem' }}>
                            <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Overall Score</p>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--gray-100)' }}>
                              {expandedSubmission.sub.olqAnalysis.overallScore} <span style={{ fontSize: '1.2rem', color: 'var(--gray-500)' }}>/ 10</span>
                            </div>
                          </div>
                          
                          <div>
                            <p style={{ color: 'var(--gray-400)', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Top Strengths</p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0, padding: 0, listStyle: 'none', fontSize: '0.85rem' }}>
                              {expandedSubmission.sub.olqAnalysis.strengths?.map((s, i) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '0.3rem', alignItems: 'center' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="✓" size="0.85rem" /> {s.name}</span>
                                  <strong>{s.score}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p style={{ color: 'var(--gray-400)', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Areas for Growth</p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0, padding: 0, listStyle: 'none', fontSize: '0.85rem' }}>
                              {expandedSubmission.sub.olqAnalysis.improvements?.map((s, i) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '0.5rem', borderRadius: '0.3rem', alignItems: 'center' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="⚠" size="0.85rem" /> {s.name}</span>
                                  <strong>{s.score}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--gray-100)', marginBottom: '0.75rem' }}>Detailed Breakdown</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {expandedSubmission.sub.olqAnalysis.details?.map((detail, i) => (
                                <div key={i} style={{ padding: '0.75rem', background: 'var(--gray-900)', borderRadius: '0.5rem', borderLeft: `3px solid ${detail.score >= 8 ? 'var(--success)' : detail.score >= 5 ? 'var(--primary)' : 'var(--danger)'}` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--gray-200)', fontSize: '0.85rem' }}>{detail.name}</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: detail.score >= 8 ? 'var(--success)' : detail.score >= 5 ? 'var(--primary)' : 'var(--danger)' }}>
                                      {detail.score}
                                    </span>
                                  </div>
                                  <p style={{ color: 'var(--gray-400)', fontSize: '0.75rem', lineHeight: '1.4', margin: 0 }}>{detail.evidence}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                       </div>
                     ) : (
                       <div style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '2rem' }}>
                         <p>No AI analysis available for this submission.</p>
                       </div>
                     )
                   )}
                   {expandedSubmissionTab === 'log' && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gray-100)', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-700)', paddingBottom: '0.5rem' }}>
                         Action Log
                       </h3>
                       {(() => {
                         const allActions = [
                           ...(expandedSubmission.sub.mapState?.markers || []).map(m => ({ ...m, _type: 'marker' })),
                           ...(expandedSubmission.sub.mapState?.paths || []).map(p => ({ ...p, _type: 'path' }))
                         ].sort((a, b) => a.id - b.id);
                         if (allActions.length === 0) return <p style={{ color: 'var(--gray-500)' }}>No actions recorded.</p>;
                         return allActions.map((action, idx) => (
                           <div key={idx} style={{ padding: '0.75rem', background: 'var(--gray-900)', borderRadius: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                               <span style={{ fontWeight: 'bold', color: 'var(--gray-200)', fontSize: '0.85rem' }}>
                                 {action._type === 'marker' ? `Placed ${action.label || action.type}` : 'Drawn Route'}
                               </span>
                               <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                 {(() => {
                                   const timeObj = action.timestamp ? new Date(action.timestamp) : new Date(action.id);
                                   let timeStr = timeObj.toLocaleTimeString();
                                   if (expandedSubmission.session.startedAt) {
                                     const diffSecs = Math.floor((timeObj.getTime() - new Date(expandedSubmission.session.startedAt).getTime()) / 1000);
                                     if (diffSecs >= 0) {
                                       const m = Math.floor(diffSecs / 60);
                                       const s = diffSecs % 60;
                                       timeStr += ` (at ${m}m ${s}s)`;
                                     }
                                   }
                                   return timeStr;
                                 })()}
                               </span>
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               {action._type === 'marker' && action.icon && <span style={{ fontSize: '1.2rem' }}>{action.icon}</span>}
                               <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>By {action.placedBy || action.drawnBy || 'Unknown'}</span>
                             </div>
                           </div>
                         ));
                       })()}
                     </div>
                   )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ===== POPUP FOR PROBLEM STATEMENT ===== */}
      {showProblemModal && expandedSubmission && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10002,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', boxShadow: '0 0 40px rgba(59,130,246,0.3)' }}>
            <h2 className="card-title" style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><SvgIcon name="📋" /> Problem Statement</h2>
            <div style={{ color: 'var(--gray-300)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              <div style={{ marginBottom: '1.5rem', background: 'var(--gray-800)', padding: '1rem', borderRadius: '0.5rem' }}>
                <strong>The Situation:</strong>
                <p style={{ marginTop: '0.5rem' }}>{expandedSubmission.session.problemDescription}</p>
              </div>
              {expandedSubmission.session.problems?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Specific Problems:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                    {expandedSubmission.session.problems.map((p, i) => (
                      <li key={i}><span style={{ color: p.priority === 'critical' ? '#ef4444' : '#f59e0b' }}>●</span> {p.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', fontSize: '1.1rem' }} onClick={() => setShowProblemModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ===== POPUP FOR ADVANCED AI REPORT ===== */}
      {showAIReportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001,
          background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column',
          padding: '2rem', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.8rem' }}>Advanced Behavioral AI Reports</h2>
              <p style={{ color: 'var(--gray-400)', margin: 0 }}>GPE OLQ Analysis Engine v2.0 (Gemini Powered)</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowAIReportModal(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="✕" size="0.85rem" /> Close</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {aiReports.map((report, idx) => (
              <div key={idx} className="card" style={{ background: 'var(--gray-800)', border: '1px solid var(--gray-700)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-700)', paddingBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>{report.cadetName}</h3>
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Chest No: {report.chestNo} · Analysis Type: {report.analysisVersion || 'AI'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Overall Score</p>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--gray-100)' }}>
                      {report.overallOPS} <span style={{ fontSize: '1rem', color: 'var(--gray-500)', fontWeight: 'normal' }}>/ 100</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                  {/* Radar/Bar Chart Mockup for OLQs */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--gray-300)', marginBottom: '1rem', textTransform: 'uppercase' }}>OLQ Radar</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.entries(report.olqRadar || {}).map(([key, score]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ width: '35px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--gray-400)' }}>{key}</span>
                          <div style={{ flex: 1, height: '8px', background: 'var(--gray-900)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${score * 10}%`, height: '100%', 
                              background: score >= 8 ? 'var(--success)' : score >= 5 ? 'var(--primary)' : 'var(--danger)',
                              boxShadow: '0 0 10px rgba(59,130,246,0.3)'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', width: '25px', textAlign: 'right' }}>{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--gray-300)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Qualitative Summary</h4>
                      <p style={{ color: 'var(--gray-300)', fontSize: '0.95rem', lineHeight: '1.6', background: 'var(--gray-900)', padding: '1rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
                        {report.qualitativeSummary}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--success)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Behavioral Highlights</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {report.behavioralHighlights?.map((h, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--gray-300)', background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '0.3rem' }}>
                              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>[{h.olqSignal}]</span> {h.description}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Caution Flags</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {report.cautionFlags?.length > 0 ? report.cautionFlags.map((f, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--gray-300)', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '0.3rem' }}>
                              <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>!</span> {f.description}
                            </div>
                          )) : (
                            <p style={{ color: 'var(--gray-500)', fontSize: '0.8rem', fontStyle: 'italic' }}>No caution flags detected.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
