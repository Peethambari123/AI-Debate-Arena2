import React from 'react';
import { 
  Swords, LayoutDashboard, History, Home, 
  LogOut, User, Sparkles, LogIn, UserPlus
} from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'debate', label: 'Debate Arena', icon: Swords },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveTab('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Swords className="w-5 h-5 text-blue-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-blue-200">
                AI Debate Arena
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> 3.6
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Intelligent AI Debating System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
          {user && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline">Profile</span>
            </button>
          )}
        </nav>

        {/* User Profile & Auth Controls */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 p-1.5 pl-3 rounded-full">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.fullName || user.name} className="w-7 h-7 rounded-full border border-blue-500/40 object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-200 hidden lg:inline max-w-[100px] truncate">
                  {user.fullName || user.name || 'Profile'}
                </span>
              </button>

              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('login')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Register</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
