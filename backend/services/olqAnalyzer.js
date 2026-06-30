/**
 * V2.0 OLQ Analysis Engine
 * Deterministic implementation of the GPE Analysis Engine specification.
 */

const crypto = require('crypto');

const OLQ_KEYS = ['EI','RA','OA','PE','SA','C','SR','IN','SC','SD','AIG','L','D','Cour'];
const OLQ_NAMES = {
  EI: 'Effective Intelligence', RA: 'Reasoning Ability', OA: 'Organising Ability',
  PE: 'Power of Expression', SA: 'Social Adaptability', C: 'Cooperation',
  SR: 'Sense of Responsibility', IN: 'Initiative', SC: 'Self-Confidence',
  SD: 'Speed of Decision', AIG: 'Ability to Influence Group', L: 'Liveliness',
  D: 'Determination', Cour: 'Courage'
};
const OLQ_CATEGORIES = {
  'Planning & Organising': ['EI','RA','OA','PE'],
  'Social Adjustment': ['SA','C','SR'],
  'Social Effectiveness': ['IN','SC','SD','AIG','L'],
  'Dynamic Qualities': ['D','Cour']
};

const clamp = (v, lo, hi) => Math.round(Math.max(lo, Math.min(hi, v)) * 10) / 10;

// ── Semantic Analysis Dictionaries ──
const CAUSAL_WORDS = /\b(because|therefore|hence|so that|which means|thus|consequently|since|as a result|due to)\b/gi;
const TEAM_WORDS = /\b(we|us|our|together|team|group|coordinate|collaborate|help|assist|support|jointly)\b/gi;
const STRUCTURED_WORDS = /\b(first|then|next|after|step|plan|priority|finally|lastly|secondly|phase)\b/gi;
const COMMAND_WORDS = /\b(deploy|secure|allocate|assign|dispatch|monitor|execute|proceed|intercept|evacuate)\b/gi;
const HOSTILE_WORDS = /\b(stupid|idiot|shut up|wrong|dumb|useless|terrible|nonsense|fool)\b/gi;
const VOLUNTEER_WORDS = /\b(i will|let me|i can handle|i'll take|assign me|i volunteer)\b/gi;

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

function extractCadetEvents(behavioralLog, cadetId) {
  return (behavioralLog || []).filter(e => String(e.cadetId) === String(cadetId));
}

// ── Group Context Builder ──
function buildGroupContext(session) {
  const log = session.behavioralLog || [];
  const allCadetIds = [...new Set(log.map(e => String(e.cadetId)).filter(id => id !== 'undefined' && id !== 'null'))];
  const ctx = { cadetIds: allCadetIds, cadetCount: Math.max(allCadetIds.length, 1) };
  
  ctx.actionCounts = {};
  ctx.firstActionTimes = {};
  ctx.phase1Actions = {};
  
  const sessionStart = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();

  allCadetIds.forEach(id => {
    const events = log.filter(e => String(e.cadetId) === id && e.type !== 'join' && e.type !== 'silence_flag');
    ctx.actionCounts[id] = events.length;
    
    const phase1Events = events.filter(e => e.phase === 'briefing' || e.phase === 'individual_planning');
    ctx.phase1Actions[id] = phase1Events.length;

    if (events.length > 0) {
      ctx.firstActionTimes[id] = new Date(events[0].timestamp).getTime() - sessionStart;
    } else {
      ctx.firstActionTimes[id] = 9999999;
    }
  });

  ctx.groupAvgActions = Object.values(ctx.actionCounts).reduce((a,b) => a+b, 0) / ctx.cadetCount;
  ctx.maxActionsPhase1 = Math.max(...Object.values(ctx.phase1Actions), 1);

  // Dominant voice (most accepted proposals & chat volume)
  let maxInfluence = -1;
  ctx.dominantVoiceId = null;
  allCadetIds.forEach(id => {
    const chats = log.filter(e => String(e.cadetId) === id && e.type === 'chat_message').length;
    const acceptedProps = (session.proposals || []).filter(p => String(p.proposerId) === id && p.status === 'accepted').length;
    const score = chats + (acceptedProps * 5);
    if (score > maxInfluence) {
      maxInfluence = score;
      ctx.dominantVoiceId = id;
    }
  });

  // Rank by time to first action
  ctx.actionRanks = {};
  const sortedByFirst = [...allCadetIds].sort((a,b) => ctx.firstActionTimes[a] - ctx.firstActionTimes[b]);
  sortedByFirst.forEach((id, index) => {
    ctx.actionRanks[id] = index + 1;
  });

  return ctx;
}

// ── Core Analyzer Function ──
function analyzeFullSession(cadetId, cadetName, session) {
  const log = session.behavioralLog || [];
  const myEvents = extractCadetEvents(log, cadetId);
  const grp = buildGroupContext(session);
  const groupSize = grp.cadetCount;

  // 1. Gather Basic Event Subsets
  const chatMessages = myEvents.filter(e => e.type === 'chat_message');
  const boardAdds = myEvents.filter(e => e.type === 'board_add');
  const proposalSubmits = myEvents.filter(e => e.type === 'proposal_submit');
  const challenges = myEvents.filter(e => e.type === 'challenge_submit');
  const complicationResponses = myEvents.filter(e => e.type === 'complication_response');
  const silenceFlags = myEvents.filter(e => e.type === 'silence_flag');
  
  const allChatText = chatMessages.map(m => m.data?.text || '').join(' ');
  const totalWords = allChatText.split(/\s+/).filter(Boolean).length;
  
  // 2. Proposal & Consensus Data
  const allProposals = session.proposals || [];
  const myProposals = allProposals.filter(p => String(p.proposerId) === String(cadetId));
  const acceptedProposals = myProposals.filter(p => p.status === 'accepted');
  const rejectedProposals = myProposals.filter(p => p.status === 'rejected');
  
  // Resubmissions
  const resubmittedProposals = myEvents.filter(e => e.type === 'proposal_resubmit');
  
  // 3. Map / Spatial Data
  const mySubmission = (session.submissions || []).find(s => String(s.cadet) === String(cadetId));
  const markers = mySubmission?.mapState?.markers || [];
  const note = mySubmission?.note || '';
  
  // 4. Resource & Problem Metrics
  const res = session.assignedResources || {};
  const customTotal = (res.customItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAvailable = (res.fireTrucks || 0) + (res.volunteers || 0) + (res.waterPumps || 0) + (res.ambulance || 0) + (res.police || 0) + (res.citizen || 0) + (res.car || 0) + (res.bike || 0) + customTotal;
  const resourcesDeployedPct = totalAvailable > 0 ? Math.min(markers.length / totalAvailable, 1.0) : 0;
  
  const problems = session.problems || [];
  const primaryProblems = problems.filter(p => p.isPrimary);
  const subProblems = problems.filter(p => !p.isPrimary);
  
  let primaryAddressed = false;
  if (primaryProblems.length > 0 && note.length > 0) {
    const primDesc = primaryProblems[0].description.toLowerCase().split(' ')[0]; // simple heuristic
    primaryAddressed = note.toLowerCase().includes(primDesc) || markers.length >= 2;
  } else if (markers.length >= 2) {
    primaryAddressed = true;
  }

  // 5. Computed Metrics Mapping
  const sessionStart = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
  const timeToFirstActionMs = grp.firstActionTimes[cadetId] || 9999999;
  const timeToFirstRank = grp.actionRanks[cadetId] || groupSize;
  const totalActions = myEvents.length;
  const actionsVsGroupAvg = grp.groupAvgActions > 0 ? (totalActions / grp.groupAvgActions) : 1;
  const phase1Actions = grp.phase1Actions[cadetId] || 0;
  
  const avgChatLen = chatMessages.length > 0 ? totalWords / chatMessages.length : 0;
  
  // Semantics
  const semLogical = Math.min((countMatches(allChatText + ' ' + note, CAUSAL_WORDS) + countMatches(allChatText + ' ' + note, STRUCTURED_WORDS)) / 5, 1.0);
  const semPrecision = Math.min((new Set(allChatText.toLowerCase().split(/\s+/).filter(w => w.length > 4)).size) / 30, 1.0);
  const semCommand = Math.min(countMatches(allChatText + ' ' + note, COMMAND_WORDS) / 3, 1.0);
  const semTone = countMatches(allChatText, HOSTILE_WORDS) > 0 ? 0.2 : 0.8 + (countMatches(allChatText, /\b(please|thanks|good idea|agree)\b/gi) * 0.1);
  const semTeam = Math.min(countMatches(allChatText + ' ' + note, TEAM_WORDS) / 4, 1.0);

  // 6. Special Formulas & Booleans
  const timelineUsed = note.toLowerCase().includes('time') || note.match(/\d+:\d+/);
  const adaptedAfterPushback = (rejectedProposals.length > 0 && resubmittedProposals.length > 0) || countMatches(allChatText, /\b(i see your point|let's adjust|okay we can)\b/gi) > 0;
  const builtOnOthers = countMatches(allChatText, /\b(agree with|building on|like [a-z]+ said|adding to)\b/gi) > 0;
  const volunteeredHard = countMatches(allChatText, VOLUNTEER_WORDS) > 0;
  const isDominant = String(grp.dominantVoiceId) === String(cadetId);
  const divergedConsensus = rejectedProposals.length > 0 && note.length > 50 && !note.toLowerCase().includes('agree');
  
  const longestSilencePhase3 = Math.max(...silenceFlags.filter(f => f.phase === 'group_discussion').map(f => f.data?.durationSec || 0), 0) * 1000;
  
  const compLatency = complicationResponses.length > 0 ? (complicationResponses[0].data?.latencyMs || 30000) : null;
  const complicationQuality = compLatency !== null ? (compLatency <= 45000 ? 10 : Math.max(10 - (compLatency/10000), 0)) : 5;

  const phase45Actions = myEvents.filter(e => e.phase === 'consolidation' || e.phase === 'presentation').length;
  const phase12Actions = myEvents.filter(e => e.phase === 'briefing' || e.phase === 'individual_planning').length;

  // ════════════════════════════════════════════
  //  SCORING ALGORITHMS (V2.0 Specifications)
  // ════════════════════════════════════════════
  let raw = {};
  const evidences = {};
  let penalties = {};

  // EI
  let eiBase = (resourcesDeployedPct * 3) + (semLogical * 3) + ((markers.length > 1 ? 1 : 0) * 4);
  if (!primaryAddressed && note.length > 0) eiBase -= 2;
  raw.EI = eiBase;
  evidences.EI = `Deployed ${Math.round(resourcesDeployedPct*100)}% of resources and structured plan logic (${Math.round(semLogical*100)}% clarity).`;

  // RA
  let raBase = (semLogical * 5) + (semPrecision * 3) + (compLatency !== null ? (complicationQuality * 0.2) : 2);
  raw.RA = raBase;
  evidences.RA = `Demonstrated precision in expression and logical structuring in chat and notes.`;

  // OA
  let oaBase = (resourcesDeployedPct * 4) + ((markers.length > 1 ? 1 : 0) * 3) + (timelineUsed ? 3 : 0);
  raw.OA = oaBase;
  evidences.OA = timelineUsed ? `Organized resources efficiently and explicitly established a timeline.` : `Organized resources efficiently across map zones.`;

  // PE
  let peBase = (semPrecision * 4) + (semCommand * 4) + (Math.min(avgChatLen / 40, 1) * 2);
  raw.PE = peBase;
  evidences.PE = `Averaged ${Math.round(avgChatLen)} words per message with appropriate command vocabulary.`;

  // SA
  let saBase = (Math.min(semTone, 1.0) * 5) + (adaptedAfterPushback ? 3 : 0) + 2;
  if (semTone < 0.3) saBase -= 3;
  raw.SA = saBase;
  evidences.SA = adaptedAfterPushback ? `Successfully adapted plan after receiving group feedback.` : `Maintained professional tone during group planning.`;

  // C
  let cBase = (semTeam * 4) + (Math.min(chatMessages.length * 0.1, 3)) + (builtOnOthers ? 3 : 0);
  raw.C = cBase;
  evidences.C = builtOnOthers ? `Actively built upon teammates' ideas during discussion.` : `Used team-oriented language and cooperated with group.`;

  // SR
  let srBase = ((actionsVsGroupAvg > 1 ? 1 : 0.5) * 4) + (primaryAddressed ? 3 : 0) + (volunteeredHard ? 3 : 0);
  raw.SR = srBase;
  evidences.SR = volunteeredHard ? `Volunteered for tasks and addressed primary scenario problems.` : `Committed to group tasks and addressed problems.`;

  // IN
  let rankScore = ((groupSize - timeToFirstRank + 1) / groupSize) * 10;
  let inBase = (rankScore * 0.5) + ((phase1Actions / grp.maxActionsPhase1) * 3) + ((proposalSubmits.length > 0 && timeToFirstRank === 1) ? 2 : 0);
  raw.IN = inBase;
  evidences.IN = `Ranked ${timeToFirstRank} out of ${groupSize} in initiating first action.`;

  // SC
  let scBase = ((rejectedProposals.length > 0 && resubmittedProposals.length > 0) ? 10 : 4) * 0.5 + 
               ((resubmittedProposals.length > 0 ? 10 : 5) * 0.3) + 
               (Math.max(10 - (longestSilencePhase3 / 60000 * 10), 0) * 0.2);
  raw.SC = scBase;
  evidences.SC = longestSilencePhase3 < 30000 ? `Maintained steady participation without prolonged hesitation.` : `Showed confidence during interactions.`;

  // SD
  let firstActionScore = Math.max(0, 10 - (timeToFirstActionMs / 30000));
  let sdBase = (firstActionScore * 0.3) + (complicationQuality * 0.4) + 3; // base decisiveness
  raw.SD = sdBase;
  evidences.SD = `First action taken in ${Math.round(timeToFirstActionMs/1000)}s, demonstrating decision speed.`;

  // AIG
  let acceptRate = myProposals.length > 0 ? (acceptedProposals.length / myProposals.length) : 0;
  let aigBase = (acceptRate * 4) + 2 + (isDominant ? 2 : 0);
  raw.AIG = aigBase;
  evidences.AIG = isDominant ? `Emerged as the dominant voice influencing the group consensus.` : `Achieved ${Math.round(acceptRate*100)}% acceptance rate on proposals.`;

  // L
  let volScore = Math.min(totalActions / grp.groupAvgActions, 1.5) * 6.67;
  let varietyScore = Math.min(new Set(myEvents.map(e => e.type)).size / 5 * 10, 10);
  let lBase = (volScore * 0.5) + (varietyScore * 0.3) + (semTone * 2);
  raw.L = lBase;
  evidences.L = `Activity volume was ${Math.round(volScore*10)}% of optimal baseline with diverse interaction types.`;

  // D
  let dBase = (primaryAddressed ? 4 : 2) + (resubmittedProposals.length > 0 ? 3 : 0) + (Math.min(phase45Actions / Math.max(phase12Actions, 1) * 10, 10) * 0.3);
  raw.D = dBase;
  evidences.D = resubmittedProposals.length > 0 ? `Demonstrated determination by modifying and resubmitting rejected plans.` : `Maintained effort throughout the latter phases.`;

  // Cour
  let courBase = 4;
  if (challenges.length > 0 && semLogical > 0.5) courBase += 3;
  if (divergedConsensus) courBase += 2;
  if (challenges.length >= 2) courBase += 1;
  raw.Cour = courBase;
  evidences.Cour = challenges.length > 0 ? `Challenged existing consensus with reasoned arguments.` : `Maintained standard participation without retreating.`;

  // ════════════════════════════════════════════
  // FINAL CLAMPING & FORMATTING
  // ════════════════════════════════════════════
  const finalScores = {};
  const v2Scores = {};
  
  OLQ_KEYS.forEach(k => {
    const val = clamp(raw[k] || 1, 1, 10);
    finalScores[k] = val;
    v2Scores[k] = {
      score: val,
      evidence: evidences[k] || `Exhibited baseline behaviors for ${OLQ_NAMES[k]}.`,
      confidence: totalActions < 3 ? 'LOW' : 'HIGH'
    };
  });

  const weights = session.evalWeights || {};
  let weightedSum = 0, weightTotal = 0;
  OLQ_KEYS.forEach(k => {
    const w = weights[k] || 1;
    weightedSum += finalScores[k] * w;
    weightTotal += w;
  });
  const ops_score = Math.round((weightedSum / weightTotal) * 10);

  // Group Percentiles
  const group_percentile = {};
  OLQ_KEYS.forEach(k => group_percentile[k] = 50.0); // Mocked for individual run; populated fully in generateAIReport

  // Strengths & Dev Areas
  const sortedArr = OLQ_KEYS.map(k => ({ olq: OLQ_NAMES[k], key: k, score: finalScores[k] })).sort((a,b) => b.score - a.score);
  const strengths = sortedArr.slice(0,3).map(s => ({ olq: s.olq, score: s.score, behavioral_moment: evidences[s.key], timestamp_ms: sessionStart }));
  const development_areas = sortedArr.slice(-3).reverse().map(s => ({ olq: s.olq, score: s.score, observed_behavior: `Lower consistency in ${s.olq}` }));

  // Flags
  const caution_flags = [];
  if (totalActions < (grp.groupAvgActions * 0.2)) {
    caution_flags.push({ type: 'WITHDRAWAL', timestamp_ms: Date.now(), description: 'Total actions < 20% of group average. Indicates severe withdrawal.' });
  }

  // Summary
  const topStr = strengths.map(s => s.olq.toLowerCase()).join(' and ');
  const lowStr = development_areas.map(s => s.olq.toLowerCase()).join(' and ');
  const qualSummary = `Cadet ${cadetName} demonstrated ${totalActions > grp.groupAvgActions ? 'high' : 'adequate'} engagement. They exhibited strong ${topStr}. Conversely, they lacked consistency in ${lowStr}. Overall profile indicates ${ops_score >= 6 ? 'suitable' : 'marginal'} officer potential based on behavioral markers.`;

  // ── Backwards Compatible Output Wrapper ──
  // We return the strict V2.0 schema, but also merge the V1.0 schema so the frontend works flawlessly.
  return {
    // --- V2.0 SCHEMA ---
    cadet_id: cadetId,
    cadet_name: cadetName,
    session_id: session._id ? session._id.toString() : '',
    analysis_version: "2.0",
    olq_scores: v2Scores,
    ops_score,
    qualitative_summary: qualSummary,
    strengths: strengths,
    development_areas: development_areas,
    caution_flags: caution_flags,
    group_percentile: group_percentile,
    low_confidence_flags: totalActions < 3 ? OLQ_KEYS : [],

    // --- V1.0 BACKWARDS COMPATIBILITY FOR FRONTEND ---
    cadetId, cadetName, chestNo: myEvents[0]?.chestNo || '',
    olqRadar: finalScores,
    overallOPS: ops_score,
    qualitativeSummary: qualSummary,
    behavioralHighlights: strengths.map(s => ({ timestamp: s.timestamp_ms, description: s.behavioral_moment, olqSignal: s.olq })),
    cautionFlags: caution_flags.map(c => ({ description: c.description, timestamp: c.timestamp_ms, severity: 'medium' })),
    improvements: development_areas.map(d => ({ name: d.olq, score: d.score })),
    categories: buildCategories(finalScores),
    metrics: { totalActions, chatMessages: chatMessages.length, proposalsSubmitted: myProposals.length, proposalsAccepted: acceptedProposals.length, challengesMade: challenges.length, timeToFirstSec: Math.round(timeToFirstActionMs/1000) },
    generatedAt: new Date()
  };
}

function buildCategories(scores) {
  const cats = {};
  for (const [cat, keys] of Object.entries(OLQ_CATEGORIES)) {
    const items = keys.map(k => ({ key: k, name: OLQ_NAMES[k], score: scores[k] }));
    const avg = items.reduce((s, i) => s + i.score, 0) / items.length;
    cats[cat] = { qualities: items, average: Math.round(avg * 10) / 10 };
  }
  return cats;
}

// Legacy support
function analyzeSubmission(submission, sessionData) {
  // Pass through to the V2 engine pretending it's a full session log
  const mockLog = [];
  if (submission.mapState?.markers) {
    submission.mapState.markers.forEach(m => mockLog.push({ cadetId: submission.cadet, type: 'board_add', phase: 'individual_planning' }));
  }
  const mockSession = { ...sessionData, behavioralLog: mockLog };
  const v2Result = analyzeFullSession(submission.cadet, submission.cadetName, mockSession);
  
  // Format for legacy
  return {
    overallScore: v2Result.ops_score / 10,
    categories: v2Result.categories,
    scores: v2Result.olqRadar,
    strengths: v2Result.strengths.map(s => ({ name: s.olq, score: s.score })),
    improvements: v2Result.development_areas.map(d => ({ name: d.olq, score: d.score })),
    details: OLQ_KEYS.map(k => ({ name: OLQ_NAMES[k], score: v2Result.olqRadar[k], evidence: v2Result.olq_scores[k].evidence })),
    recommendation: (v2Result.ops_score / 10) >= 8 ? 'Excellent.' : 'Average.',
    metrics: v2Result.metrics,
    analyzedAt: new Date()
  };
}

module.exports = { analyzeSubmission, analyzeFullSession, OLQ_CATEGORIES, OLQ_NAMES, OLQ_KEYS };
