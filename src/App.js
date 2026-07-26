import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import HistoryPage from './components/HistoryPage';
import DebateApp from './components/DebateApp';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ProfilePage from './components/ProfilePage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'debate' | 'dashboard' | 'history' | 'profile' | 'login' | 'register' | 'forgot-password'
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');

  // Initial session restoration on app load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const userFromUrl = params.get('user');

    if (tokenFromUrl && userFromUrl) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userFromUrl));
        localStorage.setItem('token', tokenFromUrl);
        localStorage.setItem('user', JSON.stringify(parsed));
        setUser(parsed);
        window.history.replaceState({}, document.title, '/');
      } catch (e) {}
    }

    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      // Validate token with backend /auth/me
      fetch('/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Invalid or expired session');
        })
        .then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } else {
            throw new Error('User account not found');
          }
        })
        .catch(() => {
          // Clear invalid tokens
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  // Fetch debate history when viewing history or dashboard
  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/debates/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch debate history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'dashboard' || activeTab === 'history') && user) {
      fetchHistory();
    }
  }, [activeTab, user]);

  const handleLoginSuccess = (loggedInUser, token) => {
    setUser(loggedInUser);
    setRedirectMessage('');
    setActiveTab('dashboard');
  };

  const handleRegisterSuccess = (newUser, token) => {
    setUser(newUser);
    setRedirectMessage('');
    setActiveTab('profile');
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {}

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setHistory([]);
    setRedirectMessage('');
    setActiveTab('login');
  };

  const handleDeleteDebate = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm('Delete this debate from history?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/debates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error('Failed to delete debate:', err);
    }
  };

  // Protected route guard handler
  const protectedTabs = ['debate', 'dashboard', 'history', 'profile'];
  const handleTabChange = (tab) => {
    setRedirectMessage('');
    if (protectedTabs.includes(tab) && !user) {
      setRedirectMessage('Please log in or register an account to access this feature.');
      setActiveTab('login');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'home' && (
          <LandingPage 
            onStartDebate={() => handleTabChange('debate')}
            onViewHistory={() => handleTabChange('history')}
          />
        )}

        {activeTab === 'debate' && (
          <DebateApp user={user} />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            history={history} 
            onStartDebate={() => handleTabChange('debate')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage 
            history={history} 
            loading={loadingHistory}
            onDeleteDebate={handleDeleteDebate}
            onStartDebate={() => handleTabChange('debate')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            user={user}
            onUserUpdated={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setActiveTab('register')}
            onSwitchToForgotPassword={() => setActiveTab('forgot-password')}
            redirectMessage={redirectMessage}
          />
        )}

        {activeTab === 'register' && (
          <RegisterPage
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setActiveTab('login')}
          />
        )}

        {activeTab === 'forgot-password' && (
          <ForgotPasswordPage
            onSwitchToLogin={() => setActiveTab('login')}
          />
        )}
      </main>

    </div>
  );
}

export default App;
