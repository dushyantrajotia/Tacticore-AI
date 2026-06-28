import { useState } from 'react';
import SCENARIO_TEMPLATES from '../../data/scenarioTemplates';

const STEPS = [
  { key: 'scenario', label: 'A. Scenario', icon: '📋' },
  { key: 'resources', label: 'B. Resources', icon: '🎒' },
  { key: 'problems', label: 'C. Problems', icon: '⚠' },
  { key: 'timing', label: 'D. Timing', icon: '⏱' },
  { key: 'group', label: 'E. Group', icon: '👥' },
  { key: 'evaluation', label: 'F. Evaluation', icon: '📊' },
];

const OLQ_LIST = [
  { key: 'EI', label: 'Effective Intelligence' },
  { key: 'RA', label: 'Reasoning Ability' },
  { key: 'OA', label: 'Organising Ability' },
  { key: 'PE', label: 'Power of Expression' },
  { key: 'SA', label: 'Social Adaptability' },
  { key: 'C', label: 'Cooperation' },
  { key: 'SR', label: 'Sense of Responsibility' },
  { key: 'IN', label: 'Initiative' },
  { key: 'SC', label: 'Self-Confidence' },
  { key: 'SD', label: 'Speed of Decision' },
  { key: 'AIG', label: 'Ability to Influence Group' },
  { key: 'L', label: 'Liveliness' },
  { key: 'D', label: 'Determination' },
  { key: 'Cour', label: 'Courage' },
];

const DEFAULT_TEMPLATE = SCENARIO_TEMPLATES['mohi_firing_range'];

const DEFAULT_FORM = {
  // A
  scenarioId: 'mohi_firing_range',
  title: '',
  problemDescription: DEFAULT_TEMPLATE.description,
  difficulty: DEFAULT_TEMPLATE.difficulty,
  // B
  volunteers: DEFAULT_TEMPLATE.defaultResources?.volunteers || 6,
  fireTrucks: 0,
  waterPumps: 0,
  ambulance: 0,
  police: 0,
  citizen: 0,
  car: 0,
  bike: 0,
  customItems: DEFAULT_TEMPLATE.defaultResources?.customItems || [],
  terrain: '',
  weather: '',
  // C
  problems: DEFAULT_TEMPLATE.problems.map((p, i) => ({ ...p, isPrimary: i === 0 })),
  // D
  timeLimit: 30,
  briefing: 5,
  individualPlanning: 5,
  groupDiscussion: 15,
  consolidation: 5,
  presentation: 5,
  qa: 5,
  // E
  minSize: 4,
  maxSize: 10,
  accessMode: 'open',
  // F
  evalWeights: Object.fromEntries(OLQ_LIST.map(o => [o.key, 1])),
  customRubric: '',
};

// ─── Shared styles ───
const sectionStyle = { display: 'flex', flexDirection: 'column', gap: '1.25rem' };
const labelStyle = { display: 'block', fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '0.35rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' };
const gridTwo = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const gridThree = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' };
const chipActive = { background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '2rem', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' };
const chipInactive = { ...chipActive, background: 'var(--gray-700)', color: 'var(--gray-300)' };

export default function CreateSessionWizard({ onCreated, onCancel }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  // ── Select scenario template (auto-fills fields) ──
  const selectTemplate = (templateId) => {
    const t = SCENARIO_TEMPLATES[templateId];
    if (!t) return;
    setForm(f => ({
      ...f,
      scenarioId: templateId,
      problemDescription: f.problemDescription || t.description,
      difficulty: t.difficulty || f.difficulty,
      volunteers: t.defaultResources?.volunteers ?? 0,
      fireTrucks: t.defaultResources?.fireTrucks ?? 0,
      waterPumps: t.defaultResources?.waterPumps ?? 0,
      ambulance: t.defaultResources?.ambulance ?? 0,
      police: t.defaultResources?.police ?? 0,
      citizen: t.defaultResources?.citizen ?? 0,
      car: t.defaultResources?.car ?? 0,
      bike: t.defaultResources?.bike ?? 0,
      customItems: t.defaultResources?.customItems || [],
      problems: t.problems?.length > 0 ? t.problems : f.problems,
    }));
  };

  // ── Problem helpers ──
  const addProblem = () => set('problems', [...form.problems, { description: '', priority: 'important', isPrimary: false }]);
  const updateProblem = (idx, field, value) => {
    const updated = [...form.problems];
    updated[idx] = { ...updated[idx], [field]: value };
    set('problems', updated);
  };
  const removeProblem = (idx) => set('problems', form.problems.filter((_, i) => i !== idx));

  // ── Custom resource helpers ──
  const addCustomItem = () => set('customItems', [...form.customItems, { name: '', quantity: 1, capability: '' }]);
  const updateCustomItem = (idx, field, value) => {
    const updated = [...form.customItems];
    updated[idx] = { ...updated[idx], [field]: value };
    set('customItems', updated);
  };
  const removeCustomItem = (idx) => set('customItems', form.customItems.filter((_, i) => i !== idx));

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.problemDescription.trim()) {
      setError('Scenario description is required.');
      setStep(0);
      return;
    }
    setCreating(true);
    setError('');
    try {
      const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${API}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: form.title,
          scenarioId: form.scenarioId,
          problemDescription: form.problemDescription,
          difficulty: form.difficulty,
          timeLimit: form.timeLimit,
          assignedResources: {
            volunteers: form.volunteers,
            fireTrucks: form.fireTrucks,
            waterPumps: form.waterPumps,
            ambulance: form.ambulance,
            police: form.police,
            citizen: form.citizen,
            car: form.car,
            bike: form.bike,
            customItems: form.customItems.filter(i => i.name.trim())
          },
          constraints: {
            terrain: form.terrain,
            weather: form.weather
          },
          problems: form.problems.filter(p => p.description.trim()),
          phaseDurations: {
            briefing: form.briefing,
            individualPlanning: form.individualPlanning,
            groupDiscussion: form.groupDiscussion,
            consolidation: form.consolidation,
            presentation: form.presentation,
            qa: form.qa
          },
          groupConfig: {
            minSize: form.minSize,
            maxSize: form.maxSize,
            accessMode: form.accessMode
          },
          evalWeights: form.evalWeights,
          customRubric: form.customRubric
        })
      });
      const data = await response.json();
      if (response.ok) {
        onCreated(data.session);
      } else {
        setError(data.message || 'Failed to create session.');
      }
    } catch (err) {
      setError('Connection error while creating session.');
    }
    setCreating(false);
  };

  // ── Render step content ──
  const renderStep = () => {
    switch (STEPS[step].key) {
      case 'scenario':
        return (
          <div style={sectionStyle}>
            {/* Scenario Map Selector */}
            <div>
              <label style={labelStyle}>Scenario Map Template *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {Object.values(SCENARIO_TEMPLATES).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t.id)}
                    style={{
                      padding: '0.85rem',
                      background: form.scenarioId === t.id ? 'rgba(59,130,246,0.15)' : 'var(--gray-800)',
                      border: form.scenarioId === t.id ? '2px solid var(--primary)' : '1px solid var(--gray-700)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'inherit',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{t.thumbnail}</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--gray-100)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', lineHeight: '1.4' }}>{t.description.substring(0, 70)}...</div>
                    <span style={{
                      display: 'inline-block', marginTop: '0.4rem',
                      padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase',
                      background: t.difficulty === 'hard' ? 'rgba(239,68,68,0.15)' : t.difficulty === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      color: t.difficulty === 'hard' ? '#ef4444' : t.difficulty === 'medium' ? '#f59e0b' : '#10b981'
                    }}>{t.difficulty}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Session Title</label>
              <input className="input" placeholder="e.g. Village Fire Emergency — Batch 42" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Scenario Description *</label>
              <textarea className="input" rows="4" placeholder="Describe the full situation context..." value={form.problemDescription} onChange={e => set('problemDescription', e.target.value)} required style={{ resize: 'vertical', lineHeight: '1.6' }} />
            </div>
            <div>
              <label style={labelStyle}>Difficulty Level</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['easy', 'medium', 'hard', 'custom'].map(d => (
                  <button key={d} type="button" style={form.difficulty === d ? chipActive : chipInactive} onClick={() => set('difficulty', d)}>
                    {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : d === 'hard' ? '🔴' : '⚙'} {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'resources':
        return (
          <div style={sectionStyle}>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Define the personnel, equipment, and environmental constraints for this exercise.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {[
                { key: 'volunteers', label: '👥 Volunteers', icon: '👥' },
                { key: 'fireTrucks', label: '🚒 Fire Trucks', icon: '🚒' },
                { key: 'waterPumps', label: '💧 Water Pumps', icon: '💧' },
                { key: 'ambulance', label: '🚑 Ambulance', icon: '🚑' },
                { key: 'police', label: '🚓 Police', icon: '🚓' },
                { key: 'citizen', label: '🚶 Citizen', icon: '🚶' },
                { key: 'car', label: '🚗 Car', icon: '🚗' },
                { key: 'bike', label: '🚲 Bike', icon: '🚲' },
              ].map(r => (
                <div key={r.key}>
                  <label style={labelStyle}>{r.label}</label>
                  <input type="number" className="input" min="0" value={form[r.key]} onChange={e => set(r.key, parseInt(e.target.value) || 0)} />
                </div>
              ))}
            </div>
            {/* Custom items */}
            <div>
              <label style={labelStyle}>Custom Equipment</label>
              {form.customItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input className="input" placeholder="Name" value={item.name} onChange={e => updateCustomItem(idx, 'name', e.target.value)} style={{ flex: 2 }} />
                  <input type="number" className="input" placeholder="Qty" min="1" value={item.quantity} onChange={e => updateCustomItem(idx, 'quantity', parseInt(e.target.value) || 1)} style={{ flex: 1 }} />
                  <input className="input" placeholder="Capability" value={item.capability} onChange={e => updateCustomItem(idx, 'capability', e.target.value)} style={{ flex: 2 }} />
                  <button type="button" onClick={() => removeCustomItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-secondary" onClick={addCustomItem} style={{ marginTop: '0.25rem' }}>+ Add Equipment</button>
            </div>
            {/* Environment */}
            <div style={gridTwo}>
              <div>
                <label style={labelStyle}>🏔 Terrain</label>
                <input className="input" placeholder="e.g. Hilly, forested, urban" value={form.terrain} onChange={e => set('terrain', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>🌦 Weather</label>
                <input className="input" placeholder="e.g. Monsoon rain, 35°C" value={form.weather} onChange={e => set('weather', e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 'problems':
        return (
          <div style={sectionStyle}>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Define the primary problem and optional sub-problems with priority tags.</p>
            {form.problems.map((p, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'var(--gray-800)', borderRadius: '0.5rem', border: p.isPrimary ? '2px solid var(--primary)' : '1px solid var(--gray-700)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: p.isPrimary ? 'var(--primary)' : 'var(--gray-400)' }}>
                    {p.isPrimary ? '★ PRIMARY PROBLEM' : `Sub-Problem ${idx}`}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select className="input" value={p.priority} onChange={e => updateProblem(idx, 'priority', e.target.value)} style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      <option value="critical">🔴 Critical</option>
                      <option value="important">🟡 Important</option>
                      <option value="secondary">🟢 Secondary</option>
                    </select>
                    {!p.isPrimary && (
                      <button type="button" onClick={() => removeProblem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
                    )}
                  </div>
                </div>
                <textarea className="input" rows="2" placeholder={p.isPrimary ? 'Describe the primary problem statement...' : 'Describe this sub-problem...'} value={p.description} onChange={e => updateProblem(idx, 'description', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            ))}
            {form.problems.length < 5 && (
              <button type="button" className="btn btn-sm btn-secondary" onClick={addProblem}>+ Add Sub-Problem</button>
            )}
          </div>
        );

      case 'timing':
        return (
          <div style={sectionStyle}>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Configure the total duration and per-phase time allocation.</p>
            <div>
              <label style={labelStyle}>Total Session Duration (minutes)</label>
              <input type="number" className="input" value={form.timeLimit} onChange={e => set('timeLimit', parseInt(e.target.value) || 30)} min="5" style={{ maxWidth: '200px', fontSize: '1.25rem', fontWeight: 'bold' }} />
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Phase Durations (minutes)</label>
              <div style={gridThree}>
                {[
                  { key: 'briefing', label: '📋 Briefing' },
                  { key: 'individualPlanning', label: '🧠 Individual Planning' },
                  { key: 'groupDiscussion', label: '🗣 Group Discussion' },
                  { key: 'consolidation', label: '🤝 Consolidation' },
                  { key: 'presentation', label: '🎤 Presentation' },
                  { key: 'qa', label: '❓ Q&A' },
                ].map(p => (
                  <div key={p.key}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>{p.label}</label>
                    <input type="number" className="input" min="1" value={form[p.key]} onChange={e => set(p.key, parseInt(e.target.value) || 1)} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(59,130,246,0.08)', borderRadius: '0.4rem', fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                ⏱ Sum of phase durations: <strong style={{ color: 'var(--primary)' }}>
                  {form.briefing + form.individualPlanning + form.groupDiscussion + form.consolidation + form.presentation + form.qa} min
                </strong>
                {' '}(total session: {form.timeLimit} min)
              </div>
            </div>
          </div>
        );

      case 'group':
        return (
          <div style={sectionStyle}>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Configure group size and access mode.</p>
            <div style={gridTwo}>
              <div>
                <label style={labelStyle}>Min Group Size</label>
                <input type="number" className="input" min="2" max="10" value={form.minSize} onChange={e => set('minSize', parseInt(e.target.value) || 4)} />
              </div>
              <div>
                <label style={labelStyle}>Max Group Size</label>
                <input type="number" className="input" min="2" max="20" value={form.maxSize} onChange={e => set('maxSize', parseInt(e.target.value) || 10)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Access Mode</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { mode: 'open', label: '🔓 Open (Code-based)', desc: 'Anyone with the session code can join' },
                  { mode: 'locked', label: '🔒 Locked (Assigned)', desc: 'Only pre-assigned cadets can join' },
                ].map(m => (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => set('accessMode', m.mode)}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: form.accessMode === m.mode ? 'rgba(59,130,246,0.15)' : 'var(--gray-800)',
                      border: form.accessMode === m.mode ? '2px solid var(--primary)' : '1px solid var(--gray-700)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'inherit'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: 'var(--gray-100)', marginBottom: '0.3rem' }}>{m.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'evaluation':
        return (
          <div style={sectionStyle}>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Adjust OLQ evaluation weights. Set higher values for OLQs that are more critical for this scenario. Default is 1.0 (equal weight).</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {OLQ_LIST.map(olq => (
                <div key={olq.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--gray-800)', borderRadius: '0.4rem', border: form.evalWeights[olq.key] > 1 ? '1px solid var(--primary)' : '1px solid var(--gray-700)' }}>
                  <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--gray-300)' }}>{olq.label}</span>
                  <select
                    className="input"
                    value={form.evalWeights[olq.key]}
                    onChange={e => set('evalWeights', { ...form.evalWeights, [olq.key]: parseFloat(e.target.value) })}
                    style={{ width: '70px', padding: '0.3rem', fontSize: '0.8rem', textAlign: 'center' }}
                  >
                    <option value={0.5}>0.5×</option>
                    <option value={1}>1.0×</option>
                    <option value={1.5}>1.5×</option>
                    <option value={2}>2.0×</option>
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label style={labelStyle}>Custom Rubric Notes (optional)</label>
              <textarea className="input" rows="3" placeholder="Add any custom evaluation criteria or notes for this scenario..." value={form.customRubric} onChange={e => set('customRubric', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(59,130,246,0.15)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-800)' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-100)', marginBottom: '0.2rem' }}>Create GPE Session</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Step {step + 1} of {STEPS.length}</p>
          </div>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {STEPS.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(idx)}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '0.4rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: step === idx ? '700' : '500',
                background: step === idx ? 'var(--primary)' : 'var(--gray-800)',
                color: step === idx ? 'white' : 'var(--gray-400)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.5rem' }}>
          {renderStep()}
        </div>

        {/* Error */}
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.75rem', textAlign: 'center' }}>{error}</p>}

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--gray-800)', paddingTop: '1rem' }}>
          {step > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
          ) : (
            <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={creating} style={{ minWidth: '200px' }}>
              {creating ? '⏳ Creating...' : '🚀 Create & Generate Code'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
