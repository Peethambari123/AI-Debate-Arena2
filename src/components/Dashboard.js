import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, BarChart3, TrendingUp, Target, 
  Clock, MessageSquare, Swords, Flame, Sparkles,
  Zap, Volume2, ShieldCheck, Activity, User, Bot, Hourglass
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { getApiUrl } from '../utils/apiConfig';

const Dashboard = ({ history = [], onStartDebate }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(getApiUrl('/debates/analytics'), { headers });
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [history]);

  // Compute exact analytics from analyticsData or fallback to history prop
  const totalDebates = analyticsData?.totalDebates ?? history.length;
  const wins = analyticsData?.wins ?? history.filter(d => d.winner === 'human').length;
  const losses = analyticsData?.losses ?? history.filter(d => d.winner === 'ai').length;
  const ties = analyticsData?.ties ?? history.filter(d => d.winner === 'tie' || d.winner === 'none').length;
  const winRate = analyticsData?.winRate ?? (totalDebates > 0 ? Math.round((wins / totalDebates) * 100) : 0);

  const scores = history.map(d => d.overallScore ?? d.humanScore ?? 0);
  const avgScore = analyticsData?.averageScore ?? (totalDebates > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalDebates) : 0);
  const highestScore = analyticsData?.highestScore ?? (totalDebates > 0 ? Math.max(...scores) : 0);
  const lowestScore = analyticsData?.lowestScore ?? (totalDebates > 0 ? Math.min(...scores) : 0);

  const avgPronunciation = analyticsData?.averagePronunciation ?? 0;
  const avgConfidence = analyticsData?.averageConfidence ?? 0;
  const avgFluency = analyticsData?.averageFluency ?? 0;

  const mostDebatedTopic = analyticsData?.mostDebatedTopic || (totalDebates > 0 ? history[0]?.topic || 'None' : 'None');
  const totalUserMessages = analyticsData?.totalUserMessages ?? history.reduce((acc, d) => acc + (d.messages?.filter(m => m.sender === 'human').length || 0), 0);
  const totalAiMessages = analyticsData?.totalAiMessages ?? history.reduce((acc, d) => acc + (d.messages?.filter(m => m.sender === 'ai').length || 0), 0);

  const avgDuration = analyticsData?.averageDebateDuration ?? 0;
  const avgUserResponseTime = analyticsData?.averageUserResponseTime ?? 0;
  const avgAiResponseTime = analyticsData?.averageAiResponseTime ?? 0;
  const fastestDebate = analyticsData?.fastestDebate ?? 0;
  const longestDebate = analyticsData?.longestDebate ?? 0;
  const totalSpeakingTime = analyticsData?.totalSpeakingTime ?? 0;

  const scoreTrend = analyticsData?.scoreTrend?.length > 0 
    ? analyticsData.scoreTrend 
    : history.slice().reverse().map((d, i) => ({
        name: `Debate ${i + 1}`,
        Score: d.overallScore ?? d.humanScore ?? 0,
        topic: d.topic
      }));

  const pieData = [
    { name: 'Wins', value: wins, color: '#22c55e' },
    { name: 'Losses', value: losses, color: '#ef4444' },
    { name: 'Ties', value: ties, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  const formatSec = (sec) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="space-y-8 pb-12 text-white font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            <span>MongoDB Performance Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time debate evaluations, timer metrics, and performance metrics computed directly from MongoDB Atlas.
          </p>
        </div>

        <button
          onClick={onStartDebate}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Swords className="w-4 h-4" />
          <span>Start New Debate</span>
        </button>
      </div>

      {/* METRICS GRID 1: CORE STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Debates */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-md space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Total Debates</span>
            <Swords className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalDebates}</div>
          <p className="text-[11px] text-slate-400">Recorded Sessions</p>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-md space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Win Rate</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{winRate}%</div>
          <p className="text-[11px] text-slate-400">{wins} Wins / {losses} Losses</p>
        </div>

        {/* Avg Score */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-md space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Average Score</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300">{avgScore}</div>
          <p className="text-[11px] text-slate-400">High: {highestScore} | Low: {lowestScore}</p>
        </div>

        {/* Voice Mode Debates Count */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-md space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Voice Mode Debates</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">
            {history.filter(d => (d.debateMode === 'voice' || d.debateType === 'voice')).length}
          </div>
          <p className="text-[11px] text-slate-400">
            Evaluated by Debate Engine
          </p>
        </div>

      </div>

      {/* METRICS GRID 2: TIMER & SPEECH METRICS */}
      <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          <span>Debate Timer & Response Metrics</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-1">
            <span className="text-slate-400 block font-medium">Avg Debate Duration</span>
            <span className="text-lg font-bold text-blue-400 block">{formatSec(avgDuration)}</span>
            <span className="text-[10px] text-slate-500 block">Fastest: {formatSec(fastestDebate)} | Longest: {formatSec(longestDebate)}</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-1">
            <span className="text-slate-400 block font-medium">Avg User Response Time</span>
            <span className="text-lg font-bold text-emerald-400 block">{formatSec(avgUserResponseTime)}</span>
            <span className="text-[10px] text-slate-500 block">Time to compose arguments</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-1">
            <span className="text-slate-400 block font-medium">Avg AI Response Speed</span>
            <span className="text-lg font-bold text-purple-400 block">{formatSec(avgAiResponseTime)}</span>
            <span className="text-[10px] text-slate-500 block">AI rebuttal generation time</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-1">
            <span className="text-slate-400 block font-medium">Total Messages Exchanged</span>
            <span className="text-lg font-bold text-amber-400 block">{totalUserMessages + totalAiMessages}</span>
            <span className="text-[10px] text-slate-500 block">User: {totalUserMessages} | AI: {totalAiMessages}</span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Score Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl backdrop-blur-md space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-base text-white">Debate Score Trajectory</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Sequential Progress</span>
          </div>

          <div className="h-64 w-full">
            {scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="Score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                No debate score history recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Win / Loss Pie Chart */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Win / Loss Breakdown</h3>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs italic">No outcome distribution available.</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-700/60">
            <div>
              <span className="text-[10px] text-slate-400 block">Wins</span>
              <span className="font-bold text-emerald-400">{wins}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Losses</span>
              <span className="font-bold text-rose-400">{losses}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Ties</span>
              <span className="font-bold text-amber-400">{ties}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ADDITIONAL METRICS SUMMARY */}
      <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl backdrop-blur-md space-y-3">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>MongoDB Performance Highlights</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Most Debated Topic</span>
            <span className="font-bold text-white text-sm block mt-0.5 truncate">{mostDebatedTopic}</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Average Score</span>
            <span className="font-bold text-purple-400 text-sm block mt-0.5">{avgScore} / 100</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">User Win Rate</span>
            <span className="font-bold text-emerald-400 text-sm block mt-0.5">{winRate}%</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
