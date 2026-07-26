import React from 'react';
import { 
  Swords, History, Sparkles, Brain, Award, 
  BarChart3, Mic, ShieldCheck, Zap, ArrowRight,
  TrendingUp, CheckCircle2, MessageSquare
} from 'lucide-react';

const LandingPage = ({ onStartDebate, onViewHistory }) => {
  const stats = [
    { label: 'Real-time AI Responses', value: '100%', icon: Zap, color: 'text-amber-400' },
    { label: 'Evaluation Dimensions', value: '7 Metrics', icon: Award, color: 'text-purple-400' },
    { label: 'Scoring Precision', value: '100 Point', icon: ShieldCheck, color: 'text-emerald-400' },
    { label: 'Speech & Text AI', value: 'Dual Mode', icon: Mic, color: 'text-blue-400' }
  ];

  const features = [
    {
      title: 'Contextual AI Counterarguments',
      desc: 'Powered by Gemini, the AI opponent processes full conversation context to generate crisp, logical counter-arguments.',
      icon: Brain,
      gradient: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30'
    },
    {
      title: 'Fully Transparent Scoring',
      desc: 'No black-box metrics. Every point in your final score is calculated using an explicit formula with detailed explanations.',
      icon: Award,
      gradient: 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
    },
    {
      title: 'Live Argument Analytics',
      desc: 'Monitor real-time gauges for logic, evidence, relevance, confidence, and persuasiveness during every debate turn.',
      icon: BarChart3,
      gradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
    },
    {
      title: 'Voice & Speech Mode',
      desc: 'Speak naturally into your microphone and hear the AI respond with articulate speech synthesis.',
      icon: Mic,
      gradient: 'from-amber-500/20 to-orange-500/20 border-amber-500/30'
    }
  ];

  const valueProps = [
    'Debate any topic: Technology, Ethics, Economics, Philosophy, Science',
    'Customizable difficulty levels: High School, College, Professional Competitor',
    'Actionable feedback detailing your specific strengths, weaknesses, and suggestions',
    'Permanent debate history stored securely in MongoDB Atlas'
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 text-center space-y-8">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Hero Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/80 text-blue-400 text-xs font-semibold shadow-lg backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Next-Generation AI Debate & Speech Analysis Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          AI Debate Arena
        </h1>

        {/* Hero Description */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Engage in real-time, intellectually rigorous debates against an AI trained in critical reasoning. 
          Get instant, transparent mathematical evaluations and actionable feedback.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onStartDebate}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
          >
            <Swords className="w-5 h-5" />
            <span>Enter Debate Arena</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onViewHistory}
            className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-base rounded-2xl backdrop-blur-md flex items-center justify-center gap-2 transition-all"
          >
            <History className="w-5 h-5 text-purple-400" />
            <span>View Debate History</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="pt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto px-4">
          {stats.map((st, i) => {
            const Icon = st.icon;
            return (
              <div key={i} className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-md text-left flex items-center gap-4">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700">
                  <Icon className={`w-6 h-6 ${st.color}`} />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">{st.value}</div>
                  <div className="text-xs text-slate-400 font-medium">{st.label}</div>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* FEATURES GRID */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Competitive Debaters</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Comprehensive evaluation parameters ensuring every argument is measured with total objectivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className={`bg-slate-800/60 border ${feat.gradient} p-6 rounded-2xl backdrop-blur-md space-y-3 hover:border-slate-500/50 transition-all`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
      <section className="max-w-5xl mx-auto px-4 bg-slate-800/40 border border-slate-700/60 rounded-3xl p-8 sm:p-10 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs uppercase font-mono tracking-widest text-blue-400 font-semibold">
              Why AI Debate Arena
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Elevate Your Speech & Critical Thinking
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Whether preparing for college competitions, public speaking engagements, or refining logical reasoning, our system provides an instant, impartial sparring partner.
            </p>
            
            <div className="space-y-2.5 pt-2">
              {valueProps.map((vp, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{vp}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={onStartDebate}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                Start A Debate Now
              </button>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="bg-slate-900/90 border border-slate-700 p-6 rounded-2xl space-y-4 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
              <span>Debate Round #42</span>
              <span className="text-emerald-400">● Live AI Active</span>
            </div>
            
            <div className="bg-slate-800/60 p-3 rounded-xl space-y-1">
              <div className="text-blue-400 font-semibold">User (Human):</div>
              <div className="text-slate-200">"Artificial intelligence creates more economic opportunity by driving productivity than it displaces."</div>
            </div>

            <div className="bg-purple-950/40 border border-purple-800/40 p-3 rounded-xl space-y-1">
              <div className="text-purple-400 font-semibold">AI Opponent:</div>
              <div className="text-slate-200">"While productivity rises, labor dislocation occurs faster than retraining cycles, creating systemic friction..."</div>
            </div>

            <div className="pt-2 flex justify-between text-[11px] text-slate-400 border-t border-slate-800">
              <span>Logic Score: 28/30</span>
              <span>Relevance: 15/15</span>
              <span className="text-amber-400">Total: 88/100</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-4 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <span className="font-bold text-slate-300">AI Debate Arena</span> © 2026. Powered by Google Gemini.
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>MongoDB Atlas Backend</span>
          <span>•</span>
          <span>Full Stack MERN</span>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
