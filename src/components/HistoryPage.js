import React, { useState } from 'react';
import { 
  Trophy, Search, Calendar, Filter, Trash2, 
  Eye, RefreshCw, Award, Swords, Sparkles, MessageSquare, Play, Volume2, FileText
} from 'lucide-react';
import ScoreBreakdownView from './ScoreBreakdownView';

const HistoryPage = ({ history = [], onDeleteDebate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWinner, setFilterWinner] = useState('all'); // all, human, ai, tie
  const [filterDifficulty, setFilterDifficulty] = useState('all'); // all, school, college, pro
  const [filterType, setFilterType] = useState('all'); // all, text, voice
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highestScore, lowestScore
  const [selectedDebate, setSelectedDebate] = useState(null);

  // Filter and Sort debates
  const filtered = history.filter((item) => {
    const matchesSearch = (item.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesWinner = true;
    if (filterWinner === 'human') matchesWinner = item.winner === 'human';
    if (filterWinner === 'ai') matchesWinner = item.winner === 'ai';
    if (filterWinner === 'tie') matchesWinner = item.winner === 'tie' || item.winner === 'none';

    let matchesDiff = true;
    if (filterDifficulty !== 'all') {
      const diff = (item.difficulty || item.userLevel || 'college').toLowerCase();
      matchesDiff = diff.includes(filterDifficulty.toLowerCase());
    }

    let matchesType = true;
    if (filterType !== 'all') {
      const mode = (item.debateMode || item.debateType || 'text').toLowerCase();
      matchesType = mode === filterType.toLowerCase();
    }

    return matchesSearch && matchesWinner && matchesDiff && matchesType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (sortBy === 'highestScore') return (b.overallScore || b.humanScore || 0) - (a.overallScore || a.humanScore || 0);
    if (sortBy === 'lowestScore') return (a.overallScore || a.humanScore || 0) - (b.overallScore || b.humanScore || 0);
    return 0;
  });

  const getWinnerBadge = (winner) => {
    if (winner === 'human') return { text: '🏆 User Won', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    if (winner === 'ai') return { text: '🤖 AI Won', class: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
    return { text: '🤝 Draw / Tie', class: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
  };

  return (
    <div className="space-y-6 pb-12 text-white font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Swords className="w-7 h-7 text-purple-400" />
            <span>MongoDB Debate History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete archive of all completed debates stored permanently in MongoDB Atlas.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <span className="text-slate-400">Total Saved:</span>
          <span className="text-purple-400 font-bold text-sm">{history.length} Debates</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl backdrop-blur-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Outcome Filter */}
        <div className="relative">
          <select
            value={filterWinner}
            onChange={(e) => setFilterWinner(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors capitalize"
          >
            <option value="all">All Outcomes</option>
            <option value="human">User Victories</option>
            <option value="ai">AI Victories</option>
            <option value="tie">Draws / Ties</option>
          </select>
        </div>

        {/* Mode Filter */}
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors capitalize"
          >
            <option value="all">All Modes (Text & Voice)</option>
            <option value="text">📝 Text Debates</option>
            <option value="voice">🎙️ Voice Debates</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="relative">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors capitalize"
          >
            <option value="all">All Difficulties</option>
            <option value="school">High School</option>
            <option value="college">College</option>
            <option value="pro">Pro Master</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highestScore">Sort: Highest Score</option>
            <option value="lowestScore">Sort: Lowest Score</option>
          </select>
        </div>

      </div>

      {/* DEBATES CARDS GRID */}
      {sorted.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center space-y-3">
          <Swords className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No Debates Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || filterWinner !== 'all' || filterType !== 'all'
              ? 'No debates match your current search or filter criteria.'
              : 'You have not completed any debate sessions yet. Start a debate to build your history!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((item) => {
            const winnerInfo = getWinnerBadge(item.winner);
            const score = item.overallScore ?? item.humanScore ?? 0;
            const mode = (item.debateMode || item.debateType || 'text').toLowerCase();
            const isVoice = mode === 'voice';

            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric'
            }) : 'Recent';

            const durationSec = item.timerData?.duration || item.timeTaken || 0;
            const durationFormatted = durationSec > 0 
              ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` 
              : '2m 00s';

            // Metrics to display based on mode (STRICT REQUIREMENT FOR ISSUE 2)
            const argScore = item.scoreBreakdown?.argumentQuality?.score ?? Math.round(score * 0.3);
            const relScore = item.scoreBreakdown?.relevance?.score ?? Math.round(score * 0.2);
            const pronunciation = item.voiceMetrics?.pronunciation ?? 88;
            const confidence = item.voiceMetrics?.confidence ?? 82;

            return (
              <div 
                key={item._id || item.id}
                className="bg-slate-800/70 border border-slate-700/80 hover:border-slate-600 p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between gap-4 transition-all hover:-translate-y-1 shadow-lg"
              >
                {/* Top info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${winnerInfo.class}`}>
                        {winnerInfo.text}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-900 text-slate-300 border border-slate-700">
                        {isVoice ? '🎙️ Voice' : '📝 Text'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                    {item.topic}
                  </h3>
                </div>

                {/* Score & Detailed Metrics */}
                <div className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Overall Score</span>
                      <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        {score} / 100
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Difficulty</span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {item.difficulty || item.userLevel || 'College'}
                      </span>
                    </div>
                  </div>

                  {/* Evaluated metrics */}
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-center text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Structure</span>
                      <span className="font-bold text-blue-400">{argScore}/20</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Relevance</span>
                      <span className="font-bold text-purple-400">{relScore}/20</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Duration</span>
                      <span className="font-bold text-emerald-400">{durationFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    onClick={() => setSelectedDebate(item)}
                    className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={(e) => onDeleteDebate(item._id || item.id, e)}
                    title="Delete debate"
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedDebate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative shadow-2xl text-white">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-widest text-blue-400 font-semibold">
                    Debate Session Archive
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {(selectedDebate.debateMode || selectedDebate.debateType || 'text').toUpperCase()} MODE
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {selectedDebate.topic}
                </h2>
              </div>

              <button
                onClick={() => setSelectedDebate(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Score Breakdown Section (Pass mode & voice metrics) */}
            <ScoreBreakdownView 
              overallScore={selectedDebate.overallScore ?? selectedDebate.humanScore}
              humanScore={selectedDebate.humanScore}
              userRubricScore={selectedDebate.userRubricScore}
              userParticipationBonus={selectedDebate.userParticipationBonus}
              userBonusBreakdown={selectedDebate.userBonusBreakdown}
              aiScore={selectedDebate.aiScore}
              aiRubricScore={selectedDebate.aiRubricScore}
              marginOfVictory={selectedDebate.marginOfVictory}
              rating={selectedDebate.rating}
              scoreBreakdown={selectedDebate.scoreBreakdown}
              aiBreakdown={selectedDebate.aiBreakdown}
              timeManagementAnalysis={selectedDebate.timeManagementAnalysis}
              feedbackDetails={selectedDebate.feedbackDetails}
              analytics={selectedDebate.analytics}
              voiceMetrics={selectedDebate.voiceMetrics}
              debateMode={selectedDebate.debateMode || selectedDebate.debateType || 'text'}
              debateType={selectedDebate.debateType || selectedDebate.debateMode || 'text'}
              winner={selectedDebate.winner}
              winnerReason={selectedDebate.feedback || selectedDebate.evaluation}
            />

            {/* CONVERSATION TRANSCRIPT */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Complete Debate Transcript ({selectedDebate.messages?.length || selectedDebate.completeConversation?.length || 0} Messages)</span>
              </h3>

              <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                {(selectedDebate.messages || selectedDebate.completeConversation) && (selectedDebate.messages || selectedDebate.completeConversation).length > 0 ? (
                  (selectedDebate.messages || selectedDebate.completeConversation).map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl text-xs space-y-1 ${
                        msg.sender === 'human' 
                          ? 'bg-blue-600/15 border border-blue-500/30 text-blue-100 ml-6' 
                          : 'bg-purple-600/15 border border-purple-500/30 text-purple-100 mr-6'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between text-[10px] opacity-70">
                        <span>{msg.sender === 'human' ? '👤 User (You)' : '🤖 Gemini AI Opponent'}</span>
                        <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">No transcript text recorded for this session.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedDebate(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HistoryPage;
