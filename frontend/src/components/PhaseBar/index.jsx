import SvgIcon from '../SvgIcon';

export default function PhaseBar({ currentPhase, isAccessor, onAdvance }) {
  const phases = [
    { key: 'briefing', label: 'Briefing', icon: '📋' },
    { key: 'individual_planning', label: 'Individual', icon: '🧠' },
    { key: 'group_discussion', label: 'Group', icon: '🗣' },
    { key: 'consolidation', label: 'Consolidate', icon: '🤝' },
    { key: 'presentation', label: 'Present', icon: '🎤' },
    { key: 'qa', label: 'Q&A', icon: '❓' },
  ];

  const currentIdx = phases.findIndex(p => p.key === currentPhase);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--gray-800)', padding: '0.5rem', borderRadius: '0.5rem', overflowX: 'auto' }}>
      {phases.map((p, idx) => {
        const isActive = p.key === currentPhase;
        const isPast = idx < currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{
              padding: '0.4rem 0.8rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: isActive ? '700' : '500',
              background: isActive ? 'var(--primary)' : isPast ? 'rgba(16,185,129,0.2)' : 'var(--gray-700)',
              color: isActive ? 'white' : isPast ? 'var(--success)' : 'var(--gray-500)',
              border: isActive ? '2px solid var(--primary)' : '1px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.3s',
              display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}>
              {isPast ? '✓ ' : ''}
              <SvgIcon name={p.icon} size="0.85rem" />
              <span>{p.label}</span>
            </div>
            {idx < phases.length - 1 && (
              <div style={{ width: '1.5rem', height: '2px', background: isPast ? 'var(--success)' : 'var(--gray-700)' }} />
            )}
          </div>
        );
      })}

      {isAccessor && currentPhase !== 'completed' && currentPhase !== 'waiting' && (
        <button
          className="btn btn-sm btn-success"
          onClick={onAdvance}
          style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><SvgIcon name="⏭" /> Next Phase</span>
        </button>
      )}
    </div>
  );
}
