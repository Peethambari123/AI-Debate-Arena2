import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, KeyRound, LogOut, CheckCircle2, AlertCircle, Camera, Clock, AtSign, Save, Sparkles } from 'lucide-react';

const ProfilePage = ({ user, onUserUpdated, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit' | 'security'
  const [loading, setLoading] = useState(false);

  // Edit Profile form state
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  // Preset Avatars picker
  const presetAvatars = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.username || 'debater_1')}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.username || 'debater_2')}`,
    `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(user?.username || 'debater_3')}`,
    `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(user?.username || 'debater_4')}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=ProDebater`
  ];

  // Fetch fresh user profile on load
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const freshUser = await res.json();
        if (onUserUpdated) onUserUpdated(freshUser);
      }
    } catch (err) {
      console.error('Error fetching fresh user profile:', err);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || '');
      setUsername(user.username || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');

    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }
    const cleanUser = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUser)) {
      setProfileError('Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: cleanUser,
          avatar: avatar.trim()
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileMsg('Profile details updated successfully!');
      if (onUserUpdated) onUserUpdated(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassError('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPassError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Password update failed');
      }

      setPassMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPassError(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  const currentUser = user || {};

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Account Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-950 border-2 border-indigo-500/50 p-1.5 shadow-xl overflow-hidden flex items-center justify-center">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username || 'Debater'}`}
                alt={currentUser.fullName || currentUser.name || 'User'}
                className="w-full h-full object-cover rounded-2xl bg-slate-900"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=Fallback`;
                }}
              />
            </div>
            <button
              onClick={() => setActiveTab('edit')}
              className="absolute -bottom-1 -right-1 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border border-slate-900 transition-all text-xs flex items-center gap-1"
              title="Edit Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Account Info */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentUser.fullName || currentUser.name || 'Account User'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                {currentUser.role || 'Member'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              @{currentUser.username || 'username'} &bull; {currentUser.email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Joined {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Recently'}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                {currentUser.authProvider || 'Email & Password'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'edit'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <span>Account Information</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Your personal user account metadata</p>
            </div>
            <button
              onClick={() => setActiveTab('edit')}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentUser.fullName || currentUser.name || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Username */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <AtSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username</p>
                <p className="text-sm font-bold text-white font-mono mt-0.5">
                  @{currentUser.username || 'not_set'}
                </p>
              </div>
            </div>

            {/* Email Address */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentUser.email || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Auth Provider */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Authentication Method</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentUser.authProvider || 'Email & Password'}
                </p>
              </div>
            </div>

            {/* Date Joined */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date Joined</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : 'Recently'}
                </p>
              </div>
            </div>

            {/* Last Login */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Last Login</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : 'Active now'}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE */}
      {activeTab === 'edit' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              <span>Edit User Profile</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your account details, username, and avatar picture
            </p>
          </div>

          {profileMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{profileMsg}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white font-mono focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Avatar URL & Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Profile Picture URL
              </label>
              <div className="relative mb-3">
                <Camera className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none transition-all"
                />
              </div>

              <p className="text-[11px] text-slate-400 mb-2 font-medium">Or choose a preset avatar:</p>
              <div className="flex flex-wrap gap-3">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`w-12 h-12 rounded-2xl bg-slate-950 border p-1 transition-all hover:scale-105 ${
                      avatar === url ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>

          </form>
        </div>
      )}

      {/* TAB 3: CHANGE PASSWORD */}
      {activeTab === 'security' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-400" />
              <span>Change Account Password</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ensure your account password is long and secure
            </p>
          </div>

          {passMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{passMsg}</span>
            </div>
          )}

          {passError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
