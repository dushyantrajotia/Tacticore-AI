import SvgIcon from '../SvgIcon';

export default function MasterPlan({ masterPlan = [], assignedResources = {} }) {
  // Compute resource usage
  const allResources = masterPlan.flatMap(t => t.resourcesUsed || []);
  const resourceCounts = {};
  allResources.forEach(r => { resourceCounts[r] = (resourceCounts[r] || 0) + 1; });

  // Detect conflicts (same resource in multiple tasks)
  const conflicts = [];
  Object.entries(resourceCounts).forEach(([r, count]) => {
    if (count > 1) conflicts.push(r);
  });

  const totalVolunteers = assignedResources.volunteers || 0;
  const totalTrucks = assignedResources.fireTrucks || 0;
  const totalPumps = assignedResources.waterPumps || 0;

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
      <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <SvgIcon name="📋" /> Master Plan
      </h3>

      {masterPlan.length === 0 ? (
        <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
          No accepted proposals yet. Submit and vote on proposals to build the plan.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {masterPlan.map((task, idx) => (
            <div key={idx} style={{
              padding: '0.6rem', background: 'var(--gray-800)', borderRadius: '0.4rem',
              border: task.commanderPriority ? '2px solid var(--warning)' : '1px solid var(--gray-700)',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{
                width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--primary)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0
              }}>{idx + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--gray-100)', fontSize: '0.85rem' }}>
                    {task.title}
                    {task.commanderPriority && <span style={{ color: 'var(--warning)', fontSize: '0.7rem', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="⭐" size="0.8rem" /> CMD Priority</span>}
                  </span>
                  <span style={{
                    padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase',
                    background: task.priority === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: task.priority === 'critical' ? '#ef4444' : '#f59e0b'
                  }}>{task.priority}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.2rem', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="👤" size="0.8rem" /> {task.proposerName}</span>
                  {task.estimatedTime && <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="⏱" size="0.8rem" /> {task.estimatedTime}</span>}
                  {task.resourcesUsed?.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="🎒" size="0.8rem" /> {task.resourcesUsed.join(', ')}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource summary */}
      <div style={{ borderTop: '1px solid var(--gray-700)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span>Tasks accepted:</span>
          <strong style={{ color: 'var(--gray-200)' }}>{masterPlan.length}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span>Resources assigned:</span>
          <strong style={{ color: 'var(--gray-200)' }}>{allResources.length}</strong>
        </div>
      </div>

      {/* Conflict alerts */}
      {conflicts.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          {conflicts.map(r => (
            <div key={r} style={{
              padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '0.3rem', fontSize: '0.75rem', color: 'var(--danger)', marginBottom: '0.3rem',
              display: 'flex', alignItems: 'center', gap: '0.25rem'
            }}>
              <SvgIcon name="⚠" size="0.85rem" />
              <span>Conflict: <strong>{r}</strong> is assigned to multiple tasks simultaneously</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
