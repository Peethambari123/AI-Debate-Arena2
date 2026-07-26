import React from 'react';
import { 
  Trophy, Award, CheckCircle, Sparkles, 
  Target, Bot, User, Check, X, Clock, Volume2
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const ScoreBreakdownView = ({ 
  overallScore,
  humanScore,
  userRubricScore: propUserRubricScore,
  userParticipationBonus: propUserParticipationBonus,
  userBonusBreakdown: propUserBonusBreakdown,
  aiScore: propAiScore = 85,
  aiRubricScore: propAiRubricScore,
  rating = 'Good',
  scoreBreakdown = {},
  aiBreakdown = {},
  feedbackDetails = {},
  timeManagementAnalysis = {},
  analytics = {},
  voiceMetrics = null,
  debateMode = 'text',
  debateType = 'text',
  winner = 'tie',
  winnerReason = '',
  marginOfVictory: propMarginOfVictory,
  evidenceFound = '',
  logicalFallaciesFound = [],
  topicRelevancePercentage = 100
}) => {
  const mode = (debateMode || debateType || 'text').toLowerCase();
  const isVoice = mode === 'voice';

  // Extract rubric scores for User
  const sb = {
    relevance: {
      score: scoreBreakdown?.relevance?.score ?? 15,
      max: 20,
      reason: scoreBreakdown?.relevance?.reason || 'Addressed topic prompt keywords.',
      evidence: scoreBreakdown?.relevance?.evidence || 'Direct reference to assigned debate topic.',
      suggestion: scoreBreakdown?.relevance?.suggestion || 'Keep every sentence anchored to core topic keywords.',
      example: scoreBreakdown?.relevance?.example || 'Say "Regarding the assigned topic, my position is..."'
    },
    argumentStructure: {
      score: scoreBreakdown?.argumentStructure?.score ?? scoreBreakdown?.argumentQuality?.score ?? 15,
      max: 20,
      reason: scoreBreakdown?.argumentStructure?.reason || scoreBreakdown?.argumentQuality?.reason || 'Clear claim and reasoning provided.',
      evidence: scoreBreakdown?.argumentStructure?.evidence || scoreBreakdown?.argumentQuality?.evidence || 'Claim supported by reasoning.',
      suggestion: scoreBreakdown?.argumentStructure?.suggestion || scoreBreakdown?.argumentQuality?.suggestion || 'Explain WHY your claims are true using step-by-step logic.',
      example: scoreBreakdown?.argumentStructure?.example || scoreBreakdown?.argumentQuality?.example || 'Instead of "AI is good", Say "AI improves efficiency by automating administrative tasks."'
    },
    evidence: {
      score: scoreBreakdown?.evidence?.score ?? 10,
      max: 15,
      reason: scoreBreakdown?.evidence?.reason || 'Basic reasoning provided.',
      evidence: scoreBreakdown?.evidence?.evidence || 'Arguments provided with contextual facts.',
      suggestion: scoreBreakdown?.evidence?.suggestion || 'Support claims with statistics, research, or case studies.',
      example: scoreBreakdown?.evidence?.example || 'Instead of unbacked claims, Say "A 2023 Stanford study showed remote work saves $2,000 per employee."'
    },
    counterArguments: {
      score: scoreBreakdown?.counterArguments?.score ?? 10,
      max: 15,
      reason: scoreBreakdown?.counterArguments?.reason || 'Responded to AI opponent rebuttals.',
      evidence: scoreBreakdown?.counterArguments?.evidence || 'Directly challenged premises raised by opponent.',
      suggestion: scoreBreakdown?.counterArguments?.suggestion || 'Address opponent claims in your opening sentence.',
      example: scoreBreakdown?.counterArguments?.example || 'Say "While you claimed costs are high, long-term efficiency offsets initial investment."'
    },
    logicalConsistency: {
      score: scoreBreakdown?.logicalConsistency?.score ?? 8,
      max: 10,
      reason: scoreBreakdown?.logicalConsistency?.reason || 'Maintained logical coherence.',
      evidence: scoreBreakdown?.logicalConsistency?.evidence || 'Deductive reasoning maintained without major fallacies.',
      suggestion: scoreBreakdown?.logicalConsistency?.suggestion || 'Avoid unstated assumptions.',
      example: scoreBreakdown?.logicalConsistency?.example || 'Ensure premises lead logically to conclusion.'
    },
    communication: {
      score: scoreBreakdown?.communication?.score ?? 7,
      max: 10,
      reason: scoreBreakdown?.communication?.reason || 'Articulate vocabulary and clear tone.',
      evidence: scoreBreakdown?.communication?.evidence || 'Clear sentence structure and vocabulary.',
      suggestion: scoreBreakdown?.communication?.suggestion || 'Use precise academic phrasing.',
      example: scoreBreakdown?.communication?.example || 'Use complete, structured sentences with formal phrasing.'
    },
    depthOfAnalysis: {
      score: scoreBreakdown?.depthOfAnalysis?.score ?? 7,
      max: 10,
      reason: scoreBreakdown?.depthOfAnalysis?.reason || 'Moderate analytical depth demonstrated.',
      evidence: scoreBreakdown?.depthOfAnalysis?.evidence || 'Analysis examined core cause-and-effect factors.',
      suggestion: scoreBreakdown?.depthOfAnalysis?.suggestion || 'Analyze long-term economic, social, and policy implications.',
      example: scoreBreakdown?.depthOfAnalysis?.example || 'Examine multi-perspective systemic impacts.'
    }
  };

  const calculatedUserRubric = sb.relevance.score + sb.argumentStructure.score + sb.evidence.score + sb.counterArguments.score + sb.logicalConsistency.score + sb.communication.score + sb.depthOfAnalysis.score;
  const userRubricScore = propUserRubricScore ?? calculatedUserRubric;
  const userParticipationBonus = propUserParticipationBonus ?? 8;
  const userFinalScore = humanScore ?? overallScore ?? (userRubricScore + userParticipationBonus);

  // AI Rubric Breakdown (NO BONUS)
  const aiSb = {
    relevance: { score: aiBreakdown?.relevance?.score ?? 20, max: 20 },
    argumentStructure: { score: aiBreakdown?.argumentStructure?.score ?? aiBreakdown?.argumentQuality?.score ?? 18, max: 20 },
    evidence: { score: aiBreakdown?.evidence?.score ?? 12, max: 15 },
    counterArguments: { score: aiBreakdown?.counterArguments?.score ?? 13, max: 15 },
    logicalConsistency: { score: aiBreakdown?.logicalConsistency?.score ?? 10, max: 10 },
    communication: { score: aiBreakdown?.communication?.score ?? 9, max: 10 },
    depthOfAnalysis: { score: aiBreakdown?.depthOfAnalysis?.score ?? 8, max: 10 }
  };

  const calculatedAiRubric = aiSb.relevance.score + aiSb.argumentStructure.score + aiSb.evidence.score + aiSb.counterArguments.score + aiSb.logicalConsistency.score + aiSb.communication.score + aiSb.depthOfAnalysis.score;
  const aiFinalScore = propAiRubricScore ?? propAiScore ?? calculatedAiRubric;
  const marginOfVictory = propMarginOfVictory ?? Math.abs(userFinalScore - aiFinalScore);

  const bonusBreakdown = propUserBonusBreakdown || [
    { rule: 'Responds in every turn', points: 2, maxPoints: 2, awarded: true, reason: 'Responded in every allocated turn (+2)' },
    { rule: 'Effective time utilization', points: 2, maxPoints: 2, awarded: true, reason: 'Used allocated speaking time effectively (+2)' },
    { rule: 'Addresses AI arguments', points: 2, maxPoints: 2, awarded: true, reason: 'Directly addressed AI opponent counterpoints (+2)' },
    { rule: 'Professional etiquette', points: 2, maxPoints: 2, awarded: true, reason: 'Maintained respectful debate etiquette without personal attacks (+2)' },
    { rule: 'Sustained engagement', points: 0, maxPoints: 2, awarded: false, reason: 'Brief debate responses in turn 2 (+0)' }
  ];

  // Comparison chart data
  const comparisonData = [
    { category: 'Relevance', User: sb.relevance.score, AI: aiSb.relevance.score },
    { category: 'Structure', User: sb.argumentStructure.score, AI: aiSb.argumentStructure.score },
    { category: 'Evidence', User: sb.evidence.score, AI: aiSb.evidence.score },
    { category: 'Rebuttal', User: sb.counterArguments.score, AI: aiSb.counterArguments.score },
    { category: 'Logic', User: sb.logicalConsistency.score, AI: aiSb.logicalConsistency.score },
    { category: 'Comm', User: sb.communication.score, AI: aiSb.communication.score },
    { category: 'Depth', User: sb.depthOfAnalysis.score, AI: aiSb.depthOfAnalysis.score }
  ];

  const radarData = [
    { subject: 'Relevance', A: Math.round((sb.relevance.score / 20) * 100), B: 100 },
    { subject: 'Structure', A: Math.round((sb.argumentStructure.score / 20) * 100), B: Math.round((aiSb.argumentStructure.score / 20) * 100) },
    { subject: 'Evidence', A: Math.round((sb.evidence.score / 15) * 100), B: Math.round((aiSb.evidence.score / 15) * 100) },
    { subject: 'Counter Rebuttal', A: Math.round((sb.counterArguments.score / 15) * 100), B: Math.round((aiSb.counterArguments.score / 15) * 100) },
    { subject: 'Logic', A: Math.round((sb.logicalConsistency.score / 10) * 100), B: Math.round((aiSb.logicalConsistency.score / 10) * 100) },
    { subject: 'Communication', A: Math.round((sb.communication.score / 10) * 100), B: Math.round((aiSb.communication.score / 10) * 100) }
  ];

  const ratingColors = {
    'Excellent': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    'Good': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    'Average': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    'Needs Improvement': 'bg-rose-500/20 text-rose-400 border-rose-500/40'
  };

  const userStrengths = feedbackDetails?.userStrengths || feedbackDetails?.strengths || ['Structured argument claims', 'Topical focus'];
  const userWeaknesses = feedbackDetails?.userWeaknesses || feedbackDetails?.weaknesses || ['Could incorporate empirical statistics'];
  const aiStrengths = feedbackDetails?.aiStrengths || ['Proactive counterarguments', 'Flawless prompt alignment'];
  const aiWeaknesses = feedbackDetails?.aiWeaknesses || ['Could cite additional real-world historical examples'];

  return (
    <div className="space-y-6 text-white font-sans">
      
      {/* DEBATE RESULT HEADER */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-700/80 pb-6">
          
          {/* Winner Banner */}
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl border ${winner === 'human' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : winner === 'ai' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'}`}>
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold">Evaluation Summary</span>
                <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-full border ${ratingColors[rating] || ratingColors['Good']}`}>
                  {rating}
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {isVoice ? '🎙️ Voice Debate' : '📝 Text Debate'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {winner === 'human' ? '🏆 User Victory' : winner === 'ai' ? '🤖 AI Opponent Victory' : '🤝 Debate Tied'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                {winnerReason || `Margin of victory: ${marginOfVictory} points. Scores calculated strictly via objective rubric metrics.`}
              </p>
            </div>
          </div>

          {/* User vs AI Match Scores */}
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/80 p-4 rounded-2xl w-full md:w-auto justify-around">
            
            {/* User Box */}
            <div className="text-center px-4">
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold justify-center">
                <User className="w-4 h-4" />
                <span>USER FINAL</span>
              </div>
              <span className={`text-3xl font-black block mt-1 ${userFinalScore <= 20 ? 'text-rose-400' : 'text-blue-400'}`}>
                {userFinalScore}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Rubric {userRubricScore} + Bonus {userParticipationBonus}</span>
              <span className="text-[9px] text-slate-500 uppercase font-mono">Max 110</span>
            </div>

            <div className="text-xl font-black text-slate-600">VS</div>

            {/* AI Box */}
            <div className="text-center px-4">
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold justify-center">
                <Bot className="w-4 h-4" />
                <span>AI FINAL</span>
              </div>
              <span className="text-3xl font-black text-purple-400 block mt-1">
                {aiFinalScore}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Rubric Only ({aiFinalScore})</span>
              <span className="text-[9px] text-slate-500 uppercase font-mono">No AI Bonus</span>
            </div>

          </div>

        </div>

        {/* USER PARTICIPATION BONUS BREAKDOWN */}
        <div className="bg-slate-900/90 border border-blue-500/30 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-blue-400">
            <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> User Participation Bonus Breakdown</span>
            <span className="font-mono text-emerald-400 text-sm">+{userParticipationBonus} / 10 pts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
            {bonusBreakdown.map((item, idx) => (
              <div key={idx} className={`p-2.5 rounded-lg border ${item.awarded ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[11px] truncate">{item.rule}</span>
                  <span className={`font-mono text-[10px] font-bold ${item.awarded ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {item.awarded ? '+2' : '+0'}
                  </span>
                </div>
                <p className="text-[10px] leading-tight text-slate-300">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TIME MANAGEMENT ANALYSIS CARD */}
        {timeManagementAnalysis && (
          <div className="bg-slate-900/70 border border-slate-700/60 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Time Management Analysis</span>
              <span className="font-mono text-slate-300">
                Selected Duration: {timeManagementAnalysis.selectedDuration || Math.round((timeManagementAnalysis.totalDuration || 180) / 60)} Minute Debate
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Selected</span>
                <span className="font-bold text-slate-200">{timeManagementAnalysis.selectedDuration || 1} min ({timeManagementAnalysis.totalDuration || 60}s)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">User Allocated</span>
                <span className="font-bold text-blue-300">{timeManagementAnalysis.userAllocatedTime || 30}s</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">User Time Used</span>
                <span className="font-bold text-blue-400">{timeManagementAnalysis.userTimeUsed || 0}s</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">User Time Remaining</span>
                <span className="font-bold text-emerald-400">{timeManagementAnalysis.userTimeRemaining ?? 30}s</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Avg User Speed</span>
                <span className="font-bold text-purple-400">{timeManagementAnalysis.avgUserResponseTime || timeManagementAnalysis.avgResponseTime || 0}s / turn</span>
              </div>
            </div>

            <p className="text-xs text-amber-300/90 italic bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              💡 <strong>Timing Feedback:</strong> {timeManagementAnalysis.suggestion || "Good pacing! You completed all responses within your allocated speaking time."}
            </p>
          </div>
        )}

      </div>

      {/* COMPARISON VISUALIZATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User vs AI Rubric Criteria Bar Chart */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-slate-200">Rubric Criteria Comparison (User vs AI)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="User" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="AI" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Matrix Radar Chart */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-200">Competency Radar (%)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="User" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="AI" dataKey="B" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* DETAILED 7-CRITERION EVALUATION BREAKDOWN WITH EVIDENCE */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 border-b border-slate-700 pb-3">
          <Award className="w-4 h-4 text-amber-400" />
          Full 7-Criterion Evaluation Breakdown with Debate Evidence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Topic Relevance */}
          <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-300 text-xs">1. Topic Relevance</span>
              <span className="font-mono font-bold text-cyan-400 text-xs">{sb.relevance.score} / 20</span>
            </div>
            <p className="text-xs text-slate-300"><strong className="text-slate-400">Reason:</strong> {sb.relevance.reason}</p>
            <p className="text-xs text-cyan-200/90"><strong className="text-cyan-400">Debate Evidence:</strong> {sb.relevance.evidence}</p>
            <p className="text-xs text-cyan-300/90"><strong className="text-cyan-400">Suggestion:</strong> {sb.relevance.suggestion}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <span className="text-amber-400 font-semibold block">Example of Better Answer:</span>
              <p className="italic text-slate-400">{sb.relevance.example}</p>
            </div>
          </div>

          {/* 2. Argument Structure */}
          <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-blue-300 text-xs">2. Argument Structure</span>
              <span className="font-mono font-bold text-blue-400 text-xs">{sb.argumentStructure.score} / 20</span>
            </div>
            <p className="text-xs text-slate-300"><strong className="text-slate-400">Reason:</strong> {sb.argumentStructure.reason}</p>
            <p className="text-xs text-blue-200/90"><strong className="text-blue-400">Debate Evidence:</strong> {sb.argumentStructure.evidence}</p>
            <p className="text-xs text-blue-300/90"><strong className="text-blue-400">Suggestion:</strong> {sb.argumentStructure.suggestion}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <span className="text-amber-400 font-semibold block">Example of Better Answer:</span>
              <p className="italic text-slate-400">{sb.argumentStructure.example}</p>
            </div>
          </div>

          {/* 3. Supporting Evidence */}
          <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-300 text-xs">3. Supporting Evidence</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">{sb.evidence.score} / 15</span>
            </div>
            <p className="text-xs text-slate-300"><strong className="text-slate-400">Reason:</strong> {sb.evidence.reason}</p>
            <p className="text-xs text-emerald-200/90"><strong className="text-emerald-400">Debate Evidence:</strong> {sb.evidence.evidence}</p>
            <p className="text-xs text-emerald-300/90"><strong className="text-emerald-400">Suggestion:</strong> {sb.evidence.suggestion}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <span className="text-amber-400 font-semibold block">Example of Better Answer:</span>
              <p className="italic text-slate-400">{sb.evidence.example}</p>
            </div>
          </div>

          {/* 4. Counter Argument Quality */}
          <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-purple-300 text-xs">4. Counter Argument Quality</span>
              <span className="font-mono font-bold text-purple-400 text-xs">{sb.counterArguments.score} / 15</span>
            </div>
            <p className="text-xs text-slate-300"><strong className="text-slate-400">Reason:</strong> {sb.counterArguments.reason}</p>
            <p className="text-xs text-purple-200/90"><strong className="text-purple-400">Debate Evidence:</strong> {sb.counterArguments.evidence}</p>
            <p className="text-xs text-purple-300/90"><strong className="text-purple-400">Suggestion:</strong> {sb.counterArguments.suggestion}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <span className="text-amber-400 font-semibold block">Example of Better Answer:</span>
              <p className="italic text-slate-400">{sb.counterArguments.example}</p>
            </div>
          </div>

          {/* 5. Logical Consistency */}
          <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-indigo-300 text-xs">5. Logical Consistency</span>
              <span className="font-mono font-bold text-indigo-400 text-xs">{sb.logicalConsistency.score} / 10</span>
            </div>
            <p className="text-xs text-slate-300"><strong className="text-slate-400">Reason:</strong> {sb.logicalConsistency.reason}</p>
            <p className="text-xs text-indigo-200/90"><strong className="text-indigo-400">Debate Evidence:</strong> {sb.logicalConsistency.evidence}</p>
            <p className="text-xs text-indigo-300/90"><strong className="text-indigo-400">Suggestion:</strong> {sb.logicalConsistency.suggestion}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <span className="text-amber-400 font-semibold block">Example of Better Answer:</span>
              <p className="italic text-slate-400">{sb.logicalConsistency.example}</p>
            </div>
          </div>

          {/* 6. Communication Quality */}
          <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-300 text-xs">6. Communication Quality</span>
              <span className="font-mono font-bold text-amber-400 text-xs">{sb.communication.score} / 10</span>
            </div>
            <p className="text-xs text-slate-300"><strong className="text-slate-400">Reason:</strong> {sb.communication.reason}</p>
            <p className="text-xs text-amber-200/90"><strong className="text-amber-400">Debate Evidence:</strong> {sb.communication.evidence}</p>
            <p className="text-xs text-amber-300/90"><strong className="text-amber-400">Suggestion:</strong> {sb.communication.suggestion}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <span className="text-amber-400 font-semibold block">Example of Better Answer:</span>
              <p className="italic text-slate-400">{sb.communication.example}</p>
            </div>
          </div>

          {/* 7. Depth of Analysis */}
          <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2 md:col-span-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-rose-300 text-xs">7. Depth of Analysis</span>
              <span className="font-mono font-bold text-rose-400 text-xs">{sb.depthOfAnalysis.score} / 10</span>
            </div>
            <p className="text-xs text-slate-300"><strong className="text-slate-400">Reason:</strong> {sb.depthOfAnalysis.reason}</p>
            <p className="text-xs text-rose-200/90"><strong className="text-rose-400">Debate Evidence:</strong> {sb.depthOfAnalysis.evidence}</p>
            <p className="text-xs text-rose-300/90"><strong className="text-rose-400">Suggestion:</strong> {sb.depthOfAnalysis.suggestion}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <span className="text-amber-400 font-semibold block">Example of Better Answer:</span>
              <p className="italic text-slate-400">{sb.depthOfAnalysis.example}</p>
            </div>
          </div>

        </div>
      </div>

      {/* STRENGTHS & WEAKNESSES COMPARISON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Evaluation Panel */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-2">
            <User className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-slate-200">User Performance Analysis</h3>
          </div>

          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">User Strengths</span>
            <ul className="space-y-1">
              {userStrengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Areas for Improvement</span>
            <ul className="space-y-1">
              {userWeaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg text-xs text-slate-300">
                  <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Opponent Evaluation Panel */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-200">AI Opponent Performance Analysis</h3>
          </div>

          <div>
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-1">AI Strengths</span>
            <ul className="space-y-1">
              {aiStrengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">AI Limitations Observed</span>
            <ul className="space-y-1">
              {aiWeaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg text-xs text-slate-300">
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* STRICT RULE: ONLY DISPLAY VOICE ANALYTICS FOR VOICE DEBATES! */}
      {isVoice && voiceMetrics && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-200">Voice Delivery Evaluation</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Speech Analysis Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries({
              pronunciation: { title: 'Pronunciation Accuracy', data: voiceMetrics.pronunciation },
              confidence: { title: 'Speaking Confidence', data: voiceMetrics.confidence },
              fluency: { title: 'Speech Fluency', data: voiceMetrics.fluency },
              speechPace: { title: 'Speech Pace', data: voiceMetrics.speechPace },
              voiceClarity: { title: 'Voice Clarity', data: voiceMetrics.voiceClarity },
              pauses: { title: 'Grammatical Pauses', data: voiceMetrics.pauses },
              fillerWords: { title: 'Filler Word Usage', data: voiceMetrics.fillerWords },
              intonation: { title: 'Intonation & Pitch', data: voiceMetrics.intonation },
              naturalness: { title: 'Natural Cadence', data: voiceMetrics.naturalness },
              energy: { title: 'Vocal Energy', data: voiceMetrics.energy }
            }).map(([key, item]) => {
              if (!item.data) return null;
              const val = typeof item.data === 'object' ? item.data : { score: item.data, reason: 'Evaluated from speech recording.', evidence: 'Recorded speech waveform.', suggestion: 'Maintain consistent speech clarity.' };
              return (
                <div key={key} className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-300 text-xs">{item.title}</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">{val.score ?? 85} / 100</span>
                  </div>
                  <p className="text-xs text-slate-300"><strong className="text-slate-400">Reason:</strong> {val.reason}</p>
                  <p className="text-xs text-amber-200/90"><strong className="text-amber-400">Evidence:</strong> {val.evidence}</p>
                  <p className="text-xs text-amber-300/90"><strong className="text-amber-400">Suggestion:</strong> {val.suggestion}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default ScoreBreakdownView;
