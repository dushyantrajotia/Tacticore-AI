import { useState } from 'react';
import SvgIcon from '../SvgIcon';

export default function ProposalBlock({ proposal, user, onVote, isVotingOpen }) {
  const [vote, setVote] = useState(null);
  const [reason, setReason] = useState('');

  const isMyProposal = String(proposal.proposerId) === String(user?._id);
  const alreadyVoted = proposal.votes?.some(v => String(v.cadetId) === String(user?._id));
  const borderColor = proposal.status === 'accepted' ? '#22c55e' : proposal.status === 'rejected' ? '#ef4444' : proposal.status === 'modified' ? '#f59e0b' : proposal.color || '#3b82f6';

  const handleSubmitVote = () => {
    if (!vote || isMyProposal || alreadyVoted) return;
    onVote(proposal._id, vote, reason);
  };

  return (
    <div style={{
      padding: '1rem', background: 'var(--gray-800)', borderRadius: '0.5rem',
      border: `2px solid ${borderColor}`, marginBottom: '0.75rem',
      opacity: proposal.status === 'rejected' ? 0.5 : 1, transition: 'all 0.3s'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: proposal.color || '#3b82f6' }} />
          <span style={{ fontWeight: '700', color: 'var(--gray-100)', fontSize: '0.9rem' }}>{proposal.title}</span>
        </div>
        <span style={{
          padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase',
          background: proposal.status === 'accepted' ? 'rgba(16,185,129,0.2)' : proposal.status === 'rejected' ? 'rgba(239,68,68,0.2)' : proposal.status === 'modified' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)',
          color: proposal.status === 'accepted' ? 'var(--success)' : proposal.status === 'rejected' ? 'var(--danger)' : proposal.status === 'modified' ? 'var(--warning)' : 'var(--primary)'
        }}>{proposal.status}</span>
      </div>

      {/* Details */}
      <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>
        <span>by {proposal.proposerName || proposal.chestNo}</span>
        <span style={{ margin: '0 0.5rem' }}>·</span>
        <span style={{
          padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.65rem',
          background: proposal.priority === 'critical' ? 'rgba(239,68,68,0.15)' : proposal.priority === 'important' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
          color: proposal.priority === 'critical' ? '#ef4444' : proposal.priority === 'important' ? '#f59e0b' : '#10b981'
        }}>{proposal.priority}</span>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-300)', marginBottom: '0.5rem', alignItems: 'center' }}>
        {proposal.resourcesUsed?.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="🎒" size="0.85rem" /> <strong>Resources:</strong> {proposal.resourcesUsed.join(', ')}</div>}
        {proposal.estimatedTime && <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="⏱" size="0.85rem" /> <strong>Time:</strong> {proposal.estimatedTime}</div>}
        {proposal.expectedOutcome && <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SvgIcon name="🎯" size="0.85rem" /> <strong>Outcome:</strong> {proposal.expectedOutcome}</div>}
      </div>

      {/* Vote tallies */}
      {proposal.voteResult && proposal.voteResult.total > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', marginBottom: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="✓" size="0.75rem" /> {proposal.voteResult.accepts}</span>
          <span style={{ color: 'var(--warning)' }}>± {proposal.voteResult.modifies}</span>
          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}><SvgIcon name="✗" size="0.75rem" /> {proposal.voteResult.rejects}</span>
          <span style={{ color: 'var(--gray-500)' }}>({proposal.voteResult.total} votes)</span>
        </div>
      )}

      {/* Voting controls */}
      {isVotingOpen && !isMyProposal && !alreadyVoted && proposal.status === 'pending' && (
        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--gray-900)', borderRadius: '0.4rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>Cast your vote:</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {[{ v: 'accept', label: 'Accept', icon: '✓', bg: 'rgba(16,185,129,0.2)', c: 'var(--success)' },
              { v: 'modify', label: 'Modify', icon: '±', bg: 'rgba(245,158,11,0.2)', c: 'var(--warning)' },
              { v: 'reject', label: 'Reject', icon: '✗', bg: 'rgba(239,68,68,0.2)', c: 'var(--danger)' }
            ].map(opt => (
              <button key={opt.v} onClick={() => setVote(opt.v)} style={{
                flex: 1, padding: '0.4rem', border: vote === opt.v ? `2px solid ${opt.c}` : '1px solid var(--gray-700)',
                borderRadius: '0.3rem', background: vote === opt.v ? opt.bg : 'var(--gray-800)',
                color: opt.c, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  {opt.icon !== '±' ? <SvgIcon name={opt.icon} size="0.8rem" /> : '±'}
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
          <input className="input" placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }} />
          <button className="btn btn-sm btn-primary" onClick={handleSubmitVote} disabled={!vote} style={{ width: '100%' }}>Submit Vote</button>
        </div>
      )}

      {alreadyVoted && (
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <SvgIcon name="✓" size="0.75rem" /> You have voted on this proposal
        </p>
      )}
    </div>
  );
}
