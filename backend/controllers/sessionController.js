const Session = require('../models/Session');
const crypto = require('crypto');
const { analyzeSubmission, analyzeFullSession } = require('../services/olqAnalyzer');
const { analyzeCadetSession } = require('../services/geminiAnalyzer');

const generateSessionCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

// ── Phase order ──
const PHASE_ORDER = ['waiting', 'briefing', 'individual_planning', 'group_discussion', 'consolidation', 'presentation', 'qa', 'completed'];
const PHASE_TIMESTAMP_MAP = {
  briefing: 'briefingStart', individual_planning: 'individualStart',
  group_discussion: 'groupStart', consolidation: 'consolidationStart',
  presentation: 'presentationStart', qa: 'qaStart', completed: null
};
const PHASE_END_MAP = {
  briefing: 'briefingEnd', individual_planning: 'individualEnd',
  group_discussion: 'groupEnd', consolidation: 'consolidationEnd',
  presentation: 'presentationEnd', qa: 'qaEnd'
};

// ═════════════════════════════════════════════
// CRUD
// ═════════════════════════════════════════════

exports.createSession = async (req, res) => {
  try {
    const { title, scenarioId, problemDescription, difficulty, assignedResources, constraints, problems, timeLimit, phaseDurations, groupConfig, evalWeights, customRubric, optimumSolution } = req.body;
    let sessionCode = generateSessionCode();
    while (await Session.findOne({ sessionCode })) sessionCode = generateSessionCode();

    const session = new Session({
      sessionCode, accessor: req.user.id, title: title || '', scenarioId: scenarioId || 'village_fire',
      problemDescription, difficulty: difficulty || 'medium', assignedResources, constraints,
      problems: problems || [], timeLimit, phaseDurations, groupConfig, evalWeights, customRubric,
      optimumSolution, status: 'waiting', phase: 'waiting'
    });
    await session.save();
    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
};

exports.joinSession = async (req, res) => {
  try {
    const { sessionCode } = req.body;
    const session = await Session.findOne({ sessionCode: sessionCode.toUpperCase() }).populate('accessor', 'name').populate('participants', 'name chestNo batch');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!session.participants.some(p => p._id.toString() === req.user.id)) {
      session.participants.push(req.user.id);
      await session.save();
    }
    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Error joining session', error: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('accessor', 'name').populate('participants', 'name chestNo batch cadetType');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching session', error: error.message });
  }
};

exports.getAccessorSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ accessor: req.user.id }).populate('participants', 'name chestNo batch').sort({ createdAt: -1 });
    res.status(200).json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
};

exports.getSessionParticipants = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('participants', 'name chestNo batch cadetType');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.status(200).json({ participants: session.participants });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching participants', error: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
};

exports.duplicateSession = async (req, res) => {
  try {
    const source = await Session.findById(req.params.id);
    if (!source) return res.status(404).json({ message: 'Session not found' });

    let sessionCode = generateSessionCode();
    while (await Session.findOne({ sessionCode })) sessionCode = generateSessionCode();

    const duplicate = new Session({
      sessionCode,
      accessor: req.user.id,
      title: `${source.title || 'Session'} (Copy)`,
      scenarioId: source.scenarioId,
      problemDescription: source.problemDescription,
      difficulty: source.difficulty,
      assignedResources: source.assignedResources,
      constraints: source.constraints,
      problems: source.problems,
      timeLimit: source.timeLimit,
      phaseDurations: source.phaseDurations,
      groupConfig: source.groupConfig,
      evalWeights: source.evalWeights,
      customRubric: source.customRubric,
      optimumSolution: source.optimumSolution,
      status: 'waiting',
      phase: 'waiting',
      participants: [],
      submissions: [],
      behavioralLog: []
    });
    await duplicate.save();
    res.status(201).json({ session: duplicate });
  } catch (error) {
    res.status(500).json({ message: 'Error duplicating session', error: error.message });
  }
};

// ═════════════════════════════════════════════
// PHASE CONTROL
// ═════════════════════════════════════════════

exports.startSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.accessor.toString() !== req.user.id) return res.status(403).json({ message: 'Only the session creator can start it' });
    if (session.phase !== 'waiting') return res.status(400).json({ message: 'Session has already been started' });

    session.phase = 'briefing';
    session.status = 'active';
    session.startedAt = new Date();
    session.phaseTimestamps = { ...session.phaseTimestamps, briefingStart: new Date() };
    await session.save();

    const io = req.app.get('io');
    if (io) io.to(session._id.toString()).emit('sessionPhaseChange', { phase: session.phase, status: session.status, startedAt: session.startedAt, phaseDurations: session.phaseDurations });

    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Error starting session', error: error.message });
  }
};

exports.advancePhase = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.accessor.toString() !== req.user.id) return res.status(403).json({ message: 'Only the instructor can advance phases' });

    const currentIdx = PHASE_ORDER.indexOf(session.phase);
    if (currentIdx === -1 || currentIdx >= PHASE_ORDER.length - 1) return res.status(400).json({ message: 'Cannot advance further' });

    // End current phase
    const endKey = PHASE_END_MAP[session.phase];
    if (endKey) { session.phaseTimestamps = { ...session.phaseTimestamps, [endKey]: new Date() }; }

    const nextPhase = PHASE_ORDER[currentIdx + 1];
    session.phase = nextPhase;

    // Start next phase
    const startKey = PHASE_TIMESTAMP_MAP[nextPhase];
    if (startKey) { session.phaseTimestamps = { ...session.phaseTimestamps, [startKey]: new Date() }; }

    if (nextPhase === 'completed') {
      session.status = 'completed';
      session.endedAt = new Date();
    }
    await session.save();

    const io = req.app.get('io');
    if (io) io.to(session._id.toString()).emit('sessionPhaseChange', { phase: session.phase, status: session.status, startedAt: session.startedAt, phaseDurations: session.phaseDurations });

    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Error advancing phase', error: error.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.accessor.toString() !== req.user.id) return res.status(403).json({ message: 'Only the session creator can end it' });

    session.phase = 'completed';
    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    const io = req.app.get('io');
    if (io) io.to(session._id.toString()).emit('sessionPhaseChange', { phase: 'completed', status: 'completed', endedAt: session.endedAt });

    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Error ending session', error: error.message });
  }
};

// ═════════════════════════════════════════════
// PROPOSALS
// ═════════════════════════════════════════════

exports.submitProposal = async (req, res) => {
  try {
    const { title, resourcesUsed, personnelAssigned, estimatedTime, expectedOutcome, priority } = req.body;
    const User = require('../models/User');
    const cadet = await User.findById(req.user.id);
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const proposal = {
      proposerId: req.user.id, proposerName: cadet ? `${cadet.chestNo} - ${cadet.name}` : 'Cadet',
      chestNo: cadet?.chestNo || '', color: getColorForCadet(session.participants.indexOf(req.user.id)),
      title, resourcesUsed: resourcesUsed || [], personnelAssigned: personnelAssigned || [],
      estimatedTime: estimatedTime || '', expectedOutcome: expectedOutcome || '',
      priority: priority || 'important', status: 'pending',
      voteDeadline: new Date(Date.now() + 60000), createdAt: new Date()
    };

    session.proposals.push(proposal);
    await session.save();
    const newProposal = session.proposals[session.proposals.length - 1];

    const io = req.app.get('io');
    if (io) io.to(session._id.toString()).emit('proposalSubmit', { proposal: newProposal, roomId: session._id.toString() });

    res.status(201).json({ proposal: newProposal });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting proposal', error: error.message });
  }
};

exports.voteOnProposal = async (req, res) => {
  try {
    const { vote, reason } = req.body;
    const User = require('../models/User');
    const cadet = await User.findById(req.user.id);
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const proposal = session.proposals.id(req.params.proposalId);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (String(proposal.proposerId) === String(req.user.id)) return res.status(400).json({ message: 'Cannot vote on your own proposal' });

    // Remove existing vote from this cadet
    proposal.votes = proposal.votes.filter(v => String(v.cadetId) !== String(req.user.id));
    proposal.votes.push({ cadetId: req.user.id, cadetName: cadet?.name || '', chestNo: cadet?.chestNo || '', vote, reason: reason || '' });

    // Tally
    const accepts = proposal.votes.filter(v => v.vote === 'accept').length;
    const modifies = proposal.votes.filter(v => v.vote === 'modify').length;
    const rejects = proposal.votes.filter(v => v.vote === 'reject').length;
    const total = proposal.votes.length;
    proposal.voteResult = { accepts, modifies, rejects, total };

    // Check if all non-proposer participants have voted
    const eligibleVoters = session.participants.filter(p => String(p) !== String(proposal.proposerId)).length;
    if (total >= eligibleVoters) {
      if (accepts > total / 2) {
        proposal.status = 'accepted';
        proposal.resolvedAt = new Date();
        // Add to master plan
        session.masterPlan.push({ proposalId: proposal._id, title: proposal.title, proposerName: proposal.proposerName, resourcesUsed: proposal.resourcesUsed, estimatedTime: proposal.estimatedTime, priority: proposal.priority, order: session.masterPlan.length + 1 });
      } else if (rejects > total / 2) {
        proposal.status = 'rejected';
        proposal.resolvedAt = new Date();
      } else {
        proposal.status = 'modified';
      }
    }

    await session.save();
    const io = req.app.get('io');
    if (io) io.to(session._id.toString()).emit('proposalVoteUpdate', { proposalId: proposal._id, votes: proposal.votes, voteResult: proposal.voteResult, status: proposal.status, masterPlan: session.masterPlan });

    res.status(200).json({ proposal });
  } catch (error) {
    res.status(500).json({ message: 'Error voting', error: error.message });
  }
};

exports.submitChallenge = async (req, res) => {
  try {
    const { targetProposalId, reason, alternativeProposed } = req.body;
    const User = require('../models/User');
    const cadet = await User.findById(req.user.id);
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const challenge = { targetProposalId, challengerId: req.user.id, challengerName: cadet ? `${cadet.chestNo} - ${cadet.name}` : 'Cadet', chestNo: cadet?.chestNo || '', reason, alternativeProposed: alternativeProposed || false, status: 'pending' };
    session.challenges.push(challenge);
    await session.save();
    const newChallenge = session.challenges[session.challenges.length - 1];

    const io = req.app.get('io');
    if (io) io.to(session._id.toString()).emit('challengeSubmit', { challenge: newChallenge });

    res.status(201).json({ challenge: newChallenge });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting challenge', error: error.message });
  }
};

// ═════════════════════════════════════════════
// INDIVIDUAL PLAN
// ═════════════════════════════════════════════

exports.saveIndividualPlan = async (req, res) => {
  try {
    const { planSummary, stickyNotes, arrows, resourceSelections, markers, paths } = req.body;
    const User = require('../models/User');
    const cadet = await User.findById(req.user.id);
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Remove old plan
    session.individualPlans = session.individualPlans.filter(p => String(p.cadetId) !== String(req.user.id));
    session.individualPlans.push({ cadetId: req.user.id, cadetName: cadet ? `${cadet.chestNo} - ${cadet.name}` : 'Cadet', chestNo: cadet?.chestNo || '', planSummary, stickyNotes, arrows, resourceSelections, markers, paths });
    await session.save();

    res.status(200).json({ message: 'Individual plan saved' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving plan', error: error.message });
  }
};

// ═════════════════════════════════════════════
// SUBMISSIONS
// ═════════════════════════════════════════════

exports.submitAnswer = async (req, res) => {
  try {
    const { markers, paths, note } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const User = require('../models/User');
    const cadet = await User.findById(req.user.id);
    const submissionData = { cadet: req.user.id, cadetName: cadet ? `${cadet.chestNo} - ${cadet.name}` : 'Cadet', submittedAt: new Date(), mapState: { markers: markers || [], paths: paths || [] }, note: note || '' };
    const olqAnalysis = analyzeSubmission(submissionData, session);
    submissionData.olqAnalysis = olqAnalysis;

    await Session.findByIdAndUpdate(req.params.id, { $pull: { submissions: { cadet: req.user.id } } });
    await Session.findByIdAndUpdate(req.params.id, { $push: { submissions: submissionData } });

    res.status(200).json({ message: 'Answer submitted successfully!', submission: submissionData });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting answer', error: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('submissions.cadet', 'name chestNo');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.submissions?.length > 0) {
      let updated = false;
      session.submissions.forEach(sub => { if (!sub.olqAnalysis) { sub.olqAnalysis = analyzeSubmission(sub, session); updated = true; } });
      if (updated) await session.save();
    }
    res.status(200).json({ submissions: session.submissions || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// ═════════════════════════════════════════════
// AI REPORT
// ═════════════════════════════════════════════

exports.generateAIReport = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('participants', 'name chestNo');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const reports = [];
    for (const participant of session.participants) {
      let report;
      try {
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
          const geminiResult = await analyzeCadetSession(session, participant);
          // Map Gemini format back to internal format if needed
          report = {
            cadetId: participant._id,
            cadetName: participant.name,
            chestNo: participant.chestNo,
            olqRadar: Object.fromEntries(Object.entries(geminiResult.olq_scores).map(([k, v]) => [k, v.score])),
            overallOPS: geminiResult.ops_score,
            qualitativeSummary: geminiResult.qualitative_summary,
            behavioralHighlights: geminiResult.strengths.map(s => ({
              timestamp: new Date(new Date(session.startedAt).getTime() + s.timestamp_ms),
              description: s.behavioral_moment,
              olqSignal: s.olq
            })),
            cautionFlags: geminiResult.caution_flags.map(f => ({
              description: f.description,
              timestamp: new Date(new Date(session.startedAt).getTime() + f.timestamp_ms),
              severity: f.type === 'WITHDRAWAL' ? 'high' : 'medium'
            })),
            generatedAt: new Date(),
            analysisVersion: "2.0 (Gemini)"
          };
        } else {
          throw new Error("Gemini API Key not configured");
        }
      } catch (geminiError) {
        const heuristicReport = analyzeFullSession(participant._id.toString(), participant.name, session);
        report = {
          cadetId: participant._id,
          cadetName: participant.name,
          chestNo: participant.chestNo,
          olqRadar: heuristicReport.olqRadar,
          overallOPS: heuristicReport.overallOPS,
          qualitativeSummary: heuristicReport.qualitativeSummary,
          behavioralHighlights: heuristicReport.strengths.map(s => ({
            description: `Heuristic signal: ${s.olq} scored ${s.score} (${s.behavioral_moment})`,
            olqSignal: s.olq
          })),
          cautionFlags: heuristicReport.improvements.filter(i => i.score < 4).map(i => ({
            description: `Area for growth: ${i.name}`,
            severity: 'medium'
          })),
          analysisVersion: "1.0 (Heuristic)",
          generatedAt: new Date()
        };
      }
      reports.push(report);
    }

    // Compute group comparison percentiles
    const allScores = {};
    const OLQ_KEYS = ['EI', 'RA', 'OA', 'PE', 'SA', 'C', 'SR', 'IN', 'SC', 'SD', 'AIG', 'L', 'D', 'Cour'];
    OLQ_KEYS.forEach(k => { 
      allScores[k] = reports.map(r => r.olqRadar[k] || 0).sort((a, b) => a - b); 
    });
    
    reports.forEach(r => {
      r.groupComparison = {};
      OLQ_KEYS.forEach(k => {
        const arr = allScores[k];
        const val = r.olqRadar[k] || 0;
        const rank = arr.indexOf(val);
        r.groupComparison[k] = Math.round(((rank + 1) / arr.length) * 100);
      });
    });

    session.aiReports = reports;
    await session.save();
    res.status(200).json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};

exports.getAIReport = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).select('aiReports');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.status(200).json({ reports: session.aiReports || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

// ═════════════════════════════════════════════
// RESULTS & REPLAY
// ═════════════════════════════════════════════

exports.getMyResults = async (req, res) => {
  try {
    const sessions = await Session.find({ 'submissions.cadet': req.user.id });
    const results = [];
    for (let session of sessions) {
      let submission = session.submissions.find(s => String(s.cadet) === String(req.user.id));
      if (!submission) continue;
      if (!submission.olqAnalysis) {
        submission.olqAnalysis = analyzeSubmission(submission, session);
        await Session.updateOne({ _id: session._id, 'submissions.cadet': req.user.id }, { $set: { 'submissions.$.olqAnalysis': submission.olqAnalysis } });
      }
      results.push({ sessionId: session._id, sessionCode: session.sessionCode, problemDescription: session.problemDescription, submission });
    }
    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
};

exports.getSessionReplay = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).select('behavioralLog sessionCode title');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.status(200).json({ replay: session.behavioralLog, sessionCode: session.sessionCode });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching replay', error: error.message });
  }
};

// ── Helper ──
function getColorForCadet(idx) {
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'];
  return colors[Math.abs(idx) % colors.length];
}
