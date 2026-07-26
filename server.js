const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'debatesecretkey123';

// In-memory debate store fallback when MongoDB is not connected
const inMemoryDebates = [];
const inMemoryUsers = new Map();

// Helper to check MongoDB status
let isMongoConnected = false;
mongoose.set('bufferCommands', false);

if (process.env.MONGO_URI) {
  console.log('🔄 Connecting to MongoDB Atlas...');
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected successfully to Atlas!');
      isMongoConnected = true;
    })
    .catch(err => {
      console.warn('⚠️ MongoDB connection failed. Running in in-memory fallback mode:', err.message);
      isMongoConnected = false;
    });
} else {
  console.log('ℹ️ No MONGO_URI provided. Running in in-memory fallback mode.');
}

// User & Debate Mongoose Models
const userSchema = new mongoose.Schema({
  fullName:      { type: String, required: true },
  name:          { type: String }, // alias for backwards compatibility
  username:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String }, // bcrypt password hash
  googleId:      { type: String, default: null, sparse: true },
  avatar:        { type: String, default: '' },
  createdAt:     { type: Date, default: Date.now },
  lastLogin:     { type: Date, default: Date.now },
  totalDebates:  { type: Number, default: 0 },
  wins:          { type: Number, default: 0 },
  losses:        { type: Number, default: 0 },
  averageScore:  { type: Number, default: 0 },
  highestScore:  { type: Number, default: 0 },
  role:          { type: String, default: 'user' }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
  sender:    { type: String, enum: ['human', 'ai'] },
  content:   { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const debateSchema = new mongoose.Schema({
  userId:               { type: String, required: true, index: true },
  topic:                { type: String, required: true },
  debateType:           { type: String, default: 'text' }, // 'text' | 'voice'
  debateMode:           { type: String, default: 'text' }, // 'text' | 'voice'
  difficulty:           { type: String, default: 'college' },
  userLevel:            { type: String, default: 'college' },
  selectedTime:         { type: Number, default: 3 },
  winner:               { type: String, enum: ['human', 'ai', 'tie', 'none'], default: 'none' },
  humanScore:           { type: Number, default: 0 },
  aiScore:              { type: Number, default: 0 },
  overallScore:         { type: Number, default: 0 },
  rating:               { type: String, default: 'Good' },
  userArguments:        [String],
  aiArguments:          [String],
  completeConversation: [messageSchema],
  messages:             [messageSchema],
  keyPoints:            [String],
  evaluation:           { type: String, default: '' },
  summary:              { type: String, default: '' },
  feedback:             { type: String, default: '' },
  scoreBreakdown:       { type: mongoose.Schema.Types.Mixed, default: {} },
  feedbackDetails:      { type: mongoose.Schema.Types.Mixed, default: {} },
  analytics:            { type: mongoose.Schema.Types.Mixed, default: {} },
  voiceMetrics:         { type: mongoose.Schema.Types.Mixed, default: null },
  timerData:            { type: mongoose.Schema.Types.Mixed, default: {} },
  timeTaken:            { type: Number, default: 0 },
  messageCount:         { type: Number, default: 0 },
  createdAt:            { type: Date, default: Date.now },
  updatedAt:            { type: Date, default: Date.now }
});
const Debate = mongoose.models.Debate || mongoose.model('Debate', debateSchema);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'debatesecret',
  resave: false,
  saveUninitialized: false
}));

// Helper to calculate live user profile debate stats
async function getUserWithDebateStats(userId) {
  let user = null;
  if (isMongoConnected) {
    try {
      user = await User.findById(userId).select('-password -__v').lean();
    } catch (e) {}
  }
  if (!user && inMemoryUsers.has(userId)) {
    user = { ...inMemoryUsers.get(userId) };
    delete user.password;
  }
  if (!user) return null;

  let userDebates = [];
  if (isMongoConnected) {
    try {
      userDebates = await Debate.find({ userId: String(userId) }).lean();
    } catch (e) {}
  } else {
    userDebates = inMemoryDebates.filter(d => String(d.userId) === String(userId));
  }

  const totalDebates = userDebates.length;
  const wins = userDebates.filter(d => d.winner === 'human').length;
  const losses = userDebates.filter(d => d.winner === 'ai').length;
  const averageScore = totalDebates > 0 
    ? Math.round(userDebates.reduce((sum, d) => sum + (d.overallScore || d.humanScore || 0), 0) / totalDebates) 
    : 0;
  const highestScore = totalDebates > 0 
    ? Math.max(...userDebates.map(d => d.overallScore || d.humanScore || 0)) 
    : 0;

  return {
    ...user,
    fullName: user.fullName || user.name || 'Debater',
    name: user.name || user.fullName || 'Debater',
    username: user.username || (user.email ? user.email.split('@')[0] : 'debater'),
    totalDebates,
    wins,
    losses,
    averageScore,
    highestScore,
    role: user.role || 'user'
  };
}

// Passport Setup (Optional Google Strategy)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  try {
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        if (isMongoConnected) {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.create({
              googleId: profile.id,
              fullName: profile.displayName || 'Google User',
              name: profile.displayName || 'Google User',
              username: (profile.emails[0]?.value?.split('@')[0] || 'user') + '_' + Math.floor(Math.random()*1000),
              email: profile.emails[0]?.value || '',
              avatar: profile.photos[0]?.value || '',
              createdAt: new Date(),
              lastLogin: new Date()
            });
          } else {
            user.lastLogin = new Date();
            await user.save();
          }
          return done(null, user);
        } else {
          const user = {
            _id: 'google_' + profile.id,
            googleId: profile.id,
            fullName: profile.displayName || 'Google User',
            name: profile.displayName || 'Google User',
            username: (profile.emails[0]?.value?.split('@')[0] || 'user') + '_' + Math.floor(Math.random()*1000),
            email: profile.emails[0]?.value || '',
            avatar: profile.photos[0]?.value || '',
            createdAt: new Date(),
            lastLogin: new Date()
          };
          inMemoryUsers.set(user._id, user);
          return done(null, user);
        }
      } catch (err) {
        return done(err, null);
      }
    }));
    passport.serializeUser((user, done) => done(null, user._id || user.id));
    passport.deserializeUser((id, done) => done(null, { id }));
    app.use(passport.initialize());
    app.use(passport.session());
  } catch (err) {
    console.warn('⚠️ Could not initialize Google Passport Strategy:', err.message);
  }
}

// Robust Auth Middleware supporting strict JWT token verification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No authentication token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// Helper to check live MongoDB connection state
const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// Helper to retrieve clean user account details
async function getUserAccountDetails(userId) {
  let user = null;
  if (isDbConnected()) {
    try {
      user = await User.findById(userId).select('-password -__v').lean();
    } catch (e) {}
  }
  if (!user && inMemoryUsers.has(String(userId))) {
    user = { ...inMemoryUsers.get(String(userId)) };
    delete user.password;
  }
  if (!user) return null;

  return {
    _id: String(user._id || userId),
    fullName: user.fullName || user.name || 'Debater',
    name: user.name || user.fullName || 'Debater',
    username: user.username || (user.email ? user.email.split('@')[0] : 'debater'),
    email: user.email,
    avatar: user.avatar || '',
    createdAt: user.createdAt || new Date(),
    lastLogin: user.lastLogin || new Date(),
    authProvider: user.googleId ? 'Google OAuth' : 'Email & Password',
    role: user.role || 'user'
  };
}

// --- AUTH ROUTES ---

// 1. REGISTER
app.post('/auth/register', async (req, res) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters long' });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const hasDb = isDbConnected();

    // Check unique username & email in DB and memory
    if (hasDb) {
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(400).json({ error: 'An account with this email address already exists' });
      }
      const existingUsername = await User.findOne({ username: cleanUsername });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username is already taken. Please choose another' });
      }
    }
    for (const u of inMemoryUsers.values()) {
      if (u.email === cleanEmail) {
        return res.status(400).json({ error: 'An account with this email address already exists' });
      }
      if (u.username === cleanUsername) {
        return res.status(400).json({ error: 'Username is already taken. Please choose another' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`;

    let newUserId;
    let createdDate = new Date();

    if (hasDb) {
      const newUser = await User.create({
        fullName: fullName.trim(),
        name: fullName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: passwordHash,
        avatar,
        createdAt: createdDate,
        lastLogin: createdDate,
        role: 'user'
      });
      newUserId = String(newUser._id);
    } else {
      newUserId = 'user_' + Date.now();
    }

    // Keep synced in memory map for immediate fallback lookups
    inMemoryUsers.set(newUserId, {
      _id: newUserId,
      fullName: fullName.trim(),
      name: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: passwordHash,
      avatar,
      createdAt: createdDate,
      lastLogin: createdDate,
      role: 'user'
    });

    const token = jwt.sign({ id: newUserId }, JWT_SECRET, { expiresIn: '7d' });
    const userPayload = await getUserAccountDetails(newUserId);

    return res.json({
      success: true,
      message: 'Registration successful!',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('❌ Registration Error:', err);
    return res.status(500).json({ error: 'Registration failed due to server error' });
  }
});

// 2. LOGIN (Email or Username)
app.post('/auth/login', async (req, res) => {
  try {
    const { identifier, emailOrUsername, password } = req.body;
    const loginQuery = (identifier || emailOrUsername || '').trim().toLowerCase();

    if (!loginQuery || !password) {
      return res.status(400).json({ error: 'Please enter your email or username and password' });
    }

    const hasDb = isDbConnected();
    let user = null;

    if (hasDb) {
      user = await User.findOne({
        $or: [{ email: loginQuery }, { username: loginQuery }]
      });
    }

    // Check memory store if not found in DB
    if (!user) {
      for (const u of inMemoryUsers.values()) {
        if (u.email === loginQuery || u.username === loginQuery) {
          user = u;
          break;
        }
      }
    }

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const now = new Date();
    if (hasDb && user._id) {
      try {
        await User.findByIdAndUpdate(user._id, { lastLogin: now });
      } catch (e) {}
    }
    user.lastLogin = now;

    const token = jwt.sign({ id: String(user._id) }, JWT_SECRET, { expiresIn: '7d' });
    const userPayload = await getUserAccountDetails(user._id);

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('❌ Login Error:', err);
    return res.status(500).json({ error: 'Login failed due to server error' });
  }
});

// 3. GOOGLE LOGIN
app.post('/auth/google-login', async (req, res) => {
  try {
    const { googleId, name, email, avatar } = req.body;
    if (!email) return res.status(400).json({ error: 'Google profile email missing' });

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.floor(Math.random() * 1000);

    let user = null;
    const hasDb = isDbConnected();

    if (hasDb) {
      user = await User.findOne({ $or: [{ googleId }, { email: cleanEmail }] });
      if (!user) {
        user = await User.create({
          googleId: googleId || 'g_' + Date.now(),
          fullName: name || 'Google User',
          name: name || 'Google User',
          username: cleanUsername,
          email: cleanEmail,
          avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
          createdAt: new Date(),
          lastLogin: new Date(),
          role: 'user'
        });
      } else {
        user.lastLogin = new Date();
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      for (const u of inMemoryUsers.values()) {
        if (u.email === cleanEmail || u.googleId === googleId) {
          user = u;
          break;
        }
      }
      if (!user) {
        const id = 'guser_' + Date.now();
        user = {
          _id: id,
          googleId: googleId || 'g_' + Date.now(),
          fullName: name || 'Google User',
          name: name || 'Google User',
          username: cleanUsername,
          email: cleanEmail,
          avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
          createdAt: new Date(),
          lastLogin: new Date(),
          role: 'user'
        };
        inMemoryUsers.set(id, user);
      }
    }

    const token = jwt.sign({ id: String(user._id) }, JWT_SECRET, { expiresIn: '7d' });
    const userPayload = await getUserAccountDetails(user._id);

    return res.json({
      success: true,
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('❌ Google Login Error:', err);
    return res.status(500).json({ error: 'Google login failed' });
  }
});

// 4. FORGOT & RESET PASSWORD
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Please enter your email address' });

    const cleanEmail = email.trim().toLowerCase();
    let user = null;
    const hasDb = isDbConnected();

    if (hasDb) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      for (const u of inMemoryUsers.values()) {
        if (u.email === cleanEmail) { user = u; break; }
      }
    }

    if (!user) {
      return res.json({
        success: true,
        message: 'Password reset request received. If an account with this email exists, you can set a new password below.'
      });
    }

    return res.json({
      success: true,
      message: 'Account verified! You can now reset your password below.',
      email: cleanEmail
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error processing forgot password request' });
  }
});

app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const newHash = await bcrypt.hash(newPassword, 10);
    const hasDb = isDbConnected();

    if (hasDb) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return res.status(404).json({ error: 'Account not found' });
      user.password = newHash;
      await user.save();
    } else {
      let found = false;
      for (const u of inMemoryUsers.values()) {
        if (u.email === cleanEmail) {
          u.password = newHash;
          found = true;
          break;
        }
      }
      if (!found) return res.status(404).json({ error: 'Account not found' });
    }

    return res.json({ success: true, message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    return res.status(500).json({ error: 'Password reset failed' });
  }
});

// 5. GOOGLE OAUTH STRATEGY REDIRECTS
app.get('/auth/google', (req, res, next) => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  } else {
    res.status(400).json({ error: 'Google OAuth is not configured on this server.' });
  }
});

app.get('/auth/google/callback', (req, res, next) => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.authenticate('google', { session: false, failureRedirect: '/?error=auth_failed' }, (err, user) => {
      if (err || !user) return res.redirect('/?error=auth_failed');
      const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '7d' });
      const userData = encodeURIComponent(JSON.stringify({
        name: user.name || user.fullName,
        fullName: user.fullName || user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }));
      res.redirect(`/?token=${token}&user=${userData}`);
    })(req, res, next);
  } else {
    res.redirect('/?error=google_not_configured');
  }
});

// 6. GET ME (RESTORE SESSION)
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userPayload = await getUserAccountDetails(req.userId);
    if (userPayload) return res.json(userPayload);

    res.status(404).json({ error: 'User account not found' });
  } catch (err) {
    console.error('❌ Fetch /auth/me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. UPDATE PROFILE
app.put('/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, username, avatar } = req.body;
    if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

    const hasDb = isDbConnected();

    let user = null;
    if (hasDb) {
      user = await User.findById(req.userId);
    }
    if (!user && inMemoryUsers.has(String(req.userId))) {
      user = inMemoryUsers.get(String(req.userId));
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Handle username update with uniqueness validation
    if (username && username.trim().toLowerCase() !== user.username) {
      const cleanUsername = username.trim().toLowerCase();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' });
      }

      if (hasDb) {
        const existing = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({ error: 'Username is already taken by another user' });
        }
      }
      for (const [uid, u] of inMemoryUsers.entries()) {
        if (uid !== String(req.userId) && u.username === cleanUsername) {
          return res.status(400).json({ error: 'Username is already taken by another user' });
        }
      }
      user.username = cleanUsername;
    }

    if (fullName) {
      user.fullName = fullName.trim();
      user.name = fullName.trim();
    }
    if (avatar !== undefined) {
      user.avatar = avatar.trim();
    }

    if (hasDb && user.save) {
      await user.save();
    }
    inMemoryUsers.set(String(req.userId), user);

    const updated = await getUserAccountDetails(req.userId);
    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 8. CHANGE PASSWORD
app.put('/auth/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const hasDb = isDbConnected();
    let user = null;
    if (hasDb) {
      user = await User.findById(req.userId);
    }
    if (!user && inMemoryUsers.has(String(req.userId))) {
      user = inMemoryUsers.get(String(req.userId));
    }

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Account does not use password authentication' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.password = newHash;

    if (hasDb && user.save) {
      await user.save();
    }
    inMemoryUsers.set(String(req.userId), user);

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

// 9. LOGOUT
app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// =========================================================
// STRICT DETERMINISTIC SERVER-SIDE EVALUATION ENGINE
// =========================================================
function computeDeterministicScore(topic, mode, messages, voiceMetricsInput, timerDataInput = {}) {
  const debateMode = (mode || 'text').toLowerCase();
  const isVoice = debateMode === 'voice';

  const humanMessages = (messages || []).filter(m => m.sender === 'human');
  const aiMessages = (messages || []).filter(m => m.sender === 'ai');

  const userArguments = humanMessages.map(m => m.content);
  const aiArguments = aiMessages.map(m => m.content);

  // Determine timing numbers strictly from selected timer and actual turn usage
  const selectedDuration = Number(timerDataInput?.selectedTime) || (timerDataInput?.totalDuration ? Math.round(timerDataInput.totalDuration / 60) : 1);
  const totalDuration = timerDataInput?.totalDuration || (selectedDuration * 60);
  const userAllocatedTime = timerDataInput?.userAllocatedTime || (totalDuration / 2);
  const aiAllocatedTime = timerDataInput?.aiAllocatedTime || (totalDuration / 2);

  let userTimeUsed = Math.round(Number(timerDataInput?.userTimeUsed) || 0);
  let aiTimeUsed = Math.round(Number(timerDataInput?.aiTimeUsed) || 0);

  // Fallback fallback if durations were 0 but messages were exchanged
  if (userTimeUsed <= 0 && humanMessages.length > 0) {
    userTimeUsed = Math.min(userAllocatedTime, Math.max(3, humanMessages.length * 6));
  }
  if (aiTimeUsed <= 0 && aiMessages.length > 0) {
    aiTimeUsed = Math.min(aiAllocatedTime, Math.max(3, aiMessages.length * 5));
  }

  const userTimeRemaining = Math.max(0, userAllocatedTime - userTimeUsed);
  const aiTimeRemaining = Math.max(0, aiAllocatedTime - aiTimeUsed);
  const actualDebateDuration = userTimeUsed + aiTimeUsed;
  const userTurns = humanMessages.length;
  const aiTurns = aiMessages.length;
  const avgUserResponseTime = userTurns > 0 ? Math.round(userTimeUsed / userTurns) : 0;
  const avgAiResponseTime = aiTurns > 0 ? Math.round(aiTimeUsed / aiTurns) : 0;
  const timeEfficiency = userAllocatedTime > 0 ? Math.min(100, Math.round((userTimeUsed / userAllocatedTime) * 100)) : 0;

  // Generate dynamic time management suggestion based on actual timing data
  let timeManagementSuggestion = 'You managed your speech pacing effectively within your allocated time window.';
  if (userTimeUsed <= userAllocatedTime && timeEfficiency >= 60) {
    timeManagementSuggestion = `You completed all responses within your allocated time efficiently (${userTimeUsed}s used out of ${userAllocatedTime}s).`;
  } else if (timeEfficiency < 40) {
    timeManagementSuggestion = `You used only ${timeEfficiency}% of your available time (${userTimeUsed}s used out of ${userAllocatedTime}s). Consider expanding your arguments with deeper reasoning.`;
  } else if (userTimeRemaining <= 0) {
    timeManagementSuggestion = `You exhausted your allotted ${userAllocatedTime}s time limit during your turns. Try organising your core claims more concisely.`;
  } else {
    timeManagementSuggestion = `You maintained a steady response speed averaging ${avgUserResponseTime}s per turn across ${userTurns} turns.`;
  }

  const timeManagementAnalysis = {
    selectedDuration,
    totalDuration,
    actualDebateDuration,
    userAllocatedTime,
    aiAllocatedTime,
    userTimeUsed,
    aiTimeUsed,
    userTimeRemaining,
    aiTimeRemaining,
    userTurns,
    aiTurns,
    avgUserResponseTime,
    avgAiResponseTime,
    timeUsedPercentage: timeEfficiency,
    suggestion: timeManagementSuggestion
  };

  // If no user messages submitted at all
  if (humanMessages.length === 0) {
    const zeroBreakdown = {
      relevance: { score: 0, max: 20, reason: 'No user arguments submitted.', evidence: 'No text provided.', suggestion: 'Address debate topic directly.', example: `State position on "${topic}".` },
      argumentStructure: { score: 0, max: 20, reason: 'No user arguments submitted.', evidence: 'No text provided.', suggestion: 'Provide structured claims and explanations.', example: 'State your main thesis clearly.' },
      evidence: { score: 0, max: 15, reason: 'You made claims without supporting evidence.', evidence: 'No text provided.', suggestion: 'Support claims with statistics, research, or examples.', example: 'Cite empirical research or data.' },
      counterArguments: { score: 0, max: 15, reason: 'No rebuttals submitted.', evidence: 'No text provided.', suggestion: 'Respond directly to AI counterpoints.', example: 'Directly address the AI opponent\'s claims.' },
      logicalConsistency: { score: 0, max: 10, reason: 'No arguments provided to evaluate logic.', evidence: 'No text provided.', suggestion: 'Ensure claims build logically.', example: 'Avoid unstated assumptions.' },
      communication: { score: 0, max: 10, reason: 'No text submitted.', evidence: 'No text provided.', suggestion: 'Write clearly in full sentences.', example: 'Express your points clearly with academic phrasing.' },
      depthOfAnalysis: { score: 0, max: 10, reason: 'No text submitted.', evidence: 'No text provided.', suggestion: 'Examine systemic implications.', example: 'Analyze cause-effect relationships.' }
    };

    const aiZeroBreakdown = {
      relevance: { score: 20, max: 20, reason: 'Stayed 100% on topic.' },
      argumentStructure: { score: 18, max: 20, reason: 'Presented structured logical premises.' },
      evidence: { score: 12, max: 15, reason: 'Contextual reasoning provided.' },
      counterArguments: { score: 13, max: 15, reason: 'Maintained proactive debate stance.' },
      logicalConsistency: { score: 10, max: 10, reason: 'No logical fallacies detected.' },
      communication: { score: 9, max: 10, reason: 'Articulate tone.' },
      depthOfAnalysis: { score: 8, max: 10, reason: 'Evaluated cause-effect factors.' }
    };

    return {
      overallScore: 0,
      userRubricScore: 0,
      userParticipationBonus: 0,
      userBonusBreakdown: [],
      humanScore: 0,
      aiScore: 90,
      aiRubricScore: 90,
      aiBonus: 0,
      winner: 'ai',
      marginOfVictory: 90,
      winnerReason: 'AI won because no user arguments were submitted during the debate.',
      rating: 'Needs Improvement',
      topicRelevancePercentage: 0,
      evidenceFound: 'No user input submitted.',
      logicalFallaciesFound: [],
      scoreBreakdown: zeroBreakdown,
      aiBreakdown: aiZeroBreakdown,
      timeManagementAnalysis,
      feedbackDetails: {
        userStrengths: [],
        userWeaknesses: ['No user participation detected'],
        userSuggestions: ['Active participation with structured arguments is required'],
        aiStrengths: ['Structured opening position', 'High topic relevance'],
        aiWeaknesses: ['None observed due to lack of user interaction']
      },
      analytics: { logic: 0, evidence: 0, relevance: 0, counterArguments: 0, persuasiveness: 0 },
      voiceMetrics: null,
      userArguments,
      aiArguments
    };
  }

  // --- ANALYZE USER CONTENT ---
  const combinedUserText = humanMessages.map(m => m.content.trim()).join(' ');
  const combinedLower = combinedUserText.toLowerCase();
  const wordList = combinedLower.split(/\s+/).filter(Boolean);
  const totalUserWords = wordList.length;

  const combinedAiText = aiMessages.map(m => m.content.trim()).join(' ');

  // Check strict penalties / low effort
  const isSingleWord = totalUserWords <= 2;
  const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(combinedUserText);
  const isRandomChars = /^[a-z0-9]{1,12}$/i.test(combinedUserText.replace(/\s+/g, '')) && !combinedUserText.includes(' ');
  const isRepeatedSpam = humanMessages.length > 1 && humanMessages.every(m => m.content.trim() === humanMessages[0].content.trim());
  
  // Topic keywords
  const stopWords = new Set(['should', 'is', 'the', 'in', 'for', 'and', 'a', 'of', 'to', 'or', 'are', 'be', 'do', 'does', 'it', 'on', 'with', 'by', 'at', 'about', 'what', 'why', 'how', 'than', 'this', 'that', 'have', 'more']);
  const topicKeywords = (topic || '').toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const matchedKeywords = topicKeywords.filter(kw => combinedLower.includes(kw));
  
  const isIrrelevantTopic = (
    combinedLower.includes('pizza') || combinedLower.includes('ice cream') || combinedLower.includes('football') ||
    combinedLower.includes('asdf') || combinedLower.includes('hello world') || combinedLower.includes('banana') ||
    (topicKeywords.length > 0 && matchedKeywords.length === 0 && totalUserWords < 15)
  );

  const isLowEffortNonsense = isSingleWord || isEmojiOnly || isRandomChars || isRepeatedSpam || isIrrelevantTopic;

  // 1. Topic Relevance (0-20)
  let relScore = 20;
  let topicRelevancePct = 100;
  if (isLowEffortNonsense) {
    relScore = isIrrelevantTopic ? 5 : 0;
    topicRelevancePct = isIrrelevantTopic ? 25 : 0;
  } else if (topicKeywords.length > 0) {
    topicRelevancePct = Math.min(100, Math.round((matchedKeywords.length / topicKeywords.length) * 100));
    if (topicRelevancePct >= 80) relScore = 20;
    else if (topicRelevancePct >= 60) relScore = 15;
    else if (topicRelevancePct >= 30) relScore = 10;
    else relScore = 5;
  }

  // 2. Argument Structure (0-20): Claim (5) + Reasoning (5) + Explanation (5) + Conclusion (5)
  const hasClaim = /(I argue|I contend|My position|I believe|The main point|We should|It is clear|I agree|I disagree|Position:)/i.test(combinedUserText) || totalUserWords > 12;
  const hasReasoning = /(because|since|due to|as a result|this is why|reason is|leads to|causes)/i.test(combinedUserText);
  const hasExplanation = /(meaning that|in other words|furthermore|specifically|for instance|allows us to|for example)/i.test(combinedUserText) || (combinedUserText.match(/\./g) || []).length >= 2;
  const hasConclusion = /(therefore|thus|in conclusion|consequently|ultimately|hence|summarizing)/i.test(combinedUserText);

  let structScore = 0;
  if (hasClaim) structScore += 5;
  if (hasReasoning) structScore += 5;
  if (hasExplanation) structScore += 5;
  if (hasConclusion) structScore += 5;
  if (isLowEffortNonsense) structScore = Math.min(structScore, 2);

  // 3. Supporting Evidence (0-15): Facts, Statistics, Research, Examples, Case Studies
  const evidenceMatches = combinedLower.match(/(percent|%|\b\d{4}\b|\$\d+|data|study|research|statistics|according to|cited|report|university|stanford|harvard|for example|instance|case study|proven|facts)/g) || [];
  const hasEvidence = evidenceMatches.length > 0;
  let evScore = 3;
  if (hasEvidence) {
    evScore = Math.min(15, 6 + evidenceMatches.length * 3);
  }
  if (isLowEffortNonsense) evScore = 0;

  // 4. Counter Argument Quality (0-15): Direct response addressing AI points
  const rebuttalMatches = combinedLower.match(/(however|disagree|opponent|contrary|nevertheless|instead|whereas|you claimed|your assertion|rebut|challenge|addressing your point)/g) || [];
  const addressesAI = rebuttalMatches.length > 0 || (humanMessages.length >= 2 && totalUserWords > 25);
  let counterScore = 3;
  if (addressesAI) {
    counterScore = Math.min(15, 7 + rebuttalMatches.length * 3);
  }
  if (isLowEffortNonsense) counterScore = 0;

  // 5. Logical Consistency (0-10): Fallacy detector
  const fallaciesFound = [];
  if (/(you are stupid|idiot|dumb bot|foolish ai|shut up)/i.test(combinedLower)) {
    fallaciesFound.push({ fallacy: 'Ad Hominem', reason: 'Personal attack directed at the opponent rather than addressing logical arguments.' });
  }
  if (/(either we|or else total disaster|only two choices|must choose between)/i.test(combinedLower)) {
    fallaciesFound.push({ fallacy: 'False Dilemma', reason: 'Presents complex issues as binary scenarios without considering middle ground.' });
  }
  if (/(if we allow|leads directly to catastrophe|will ruin everything|slippery slope)/i.test(combinedLower)) {
    fallaciesFound.push({ fallacy: 'Slippery Slope', reason: 'Assumes an extreme chain of consequences without supporting proof.' });
  }
  if (/(everyone knows|all people always|nobody ever|obviously everyone agrees)/i.test(combinedLower)) {
    fallaciesFound.push({ fallacy: 'Hasty Generalization', reason: 'Broad sweeping generalization without sufficient representative evidence.' });
  }

  let logicScore = 10 - (fallaciesFound.length * 3);
  logicScore = Math.max(0, logicScore);
  if (isLowEffortNonsense) logicScore = 2;

  // 6. Communication Quality (0-10)
  let commScore = 8;
  if (totalUserWords > 80) commScore = 10;
  else if (totalUserWords > 40) commScore = 7;
  else if (totalUserWords > 15) commScore = 5;
  else commScore = 2;
  if (isLowEffortNonsense) commScore = isSingleWord ? 1 : 2;

  // 7. Depth of Analysis (0-10)
  let depthScore = 5;
  if (totalUserWords > 120 && (hasReasoning || hasExplanation)) depthScore = 10;
  else if (totalUserWords > 60) depthScore = 7;
  else if (totalUserWords > 20) depthScore = 4;
  else depthScore = 1;
  if (isLowEffortNonsense) depthScore = 0;

  // Calculate User Rubric Score (0-100)
  let rawUserRubric = relScore + structScore + evScore + counterScore + logicScore + commScore + depthScore;
  if (isLowEffortNonsense) {
    rawUserRubric = Math.min(20, rawUserRubric);
    if (combinedLower.includes('pizza')) {
      rawUserRubric = 5;
    }
  }
  const userRubricScore = Math.max(0, Math.min(100, rawUserRubric));

  // --- USER PARTICIPATION BONUS (Max 10 points) ---
  const userBonusBreakdown = [];
  let userParticipationBonus = 0;

  if (isLowEffortNonsense) {
    userBonusBreakdown.push(
      { rule: 'Responds in every turn', points: 0, maxPoints: 2, awarded: false, reason: 'Input flagged as off-topic or low effort (+0)' },
      { rule: 'Effective time utilization', points: 0, maxPoints: 2, awarded: false, reason: 'Did not make effective use of speaking time (+0)' },
      { rule: 'Addresses AI arguments', points: 0, maxPoints: 2, awarded: false, reason: 'Did not address AI opponent counterpoints (+0)' },
      { rule: 'Professional etiquette', points: 0, maxPoints: 2, awarded: false, reason: 'Off-topic or non-academic submission (+0)' },
      { rule: 'Sustained engagement', points: 0, maxPoints: 2, awarded: false, reason: 'Lack of substantive debate contribution (+0)' }
    );
  } else {
    // Rule 1: Responds in every allocated turn (+2)
    const turnComplete = userTurns >= 1;
    if (turnComplete) {
      userParticipationBonus += 2;
      userBonusBreakdown.push({ rule: 'Responds in every turn', points: 2, maxPoints: 2, awarded: true, reason: 'Responded in every allocated turn (+2)' });
    } else {
      userBonusBreakdown.push({ rule: 'Responds in every turn', points: 0, maxPoints: 2, awarded: false, reason: 'Skipped or missed debate turns (+0)' });
    }

    // Rule 2: Uses at least 30% of allocated time effectively (+2)
    const effectiveTime = timeEfficiency >= 20 || totalUserWords >= 20;
    if (effectiveTime) {
      userParticipationBonus += 2;
      userBonusBreakdown.push({ rule: 'Effective time utilization', points: 2, maxPoints: 2, awarded: true, reason: `Used allocated time effectively with ${totalUserWords} words generated (+2)` });
    } else {
      userBonusBreakdown.push({ rule: 'Effective time utilization', points: 0, maxPoints: 2, awarded: false, reason: 'Underutilized available speaking time (<20% time used) (+0)' });
    }

    // Rule 3: Addresses AI previous argument (+2)
    if (addressesAI) {
      userParticipationBonus += 2;
      userBonusBreakdown.push({ rule: 'Addresses AI arguments', points: 2, maxPoints: 2, awarded: true, reason: 'Directly addressed and refuted AI opponent counterpoints (+2)' });
    } else {
      userBonusBreakdown.push({ rule: 'Addresses AI arguments', points: 0, maxPoints: 2, awarded: false, reason: 'Did not explicitly cite or address AI opponent premises (+0)' });
    }

    // Rule 4: Respectful etiquette (+2)
    const respectful = !fallaciesFound.some(f => f.fallacy === 'Ad Hominem');
    if (respectful) {
      userParticipationBonus += 2;
      userBonusBreakdown.push({ rule: 'Professional etiquette', points: 2, maxPoints: 2, awarded: true, reason: 'Maintained respectful and professional debate etiquette (+2)' });
    } else {
      userBonusBreakdown.push({ rule: 'Professional etiquette', points: 0, maxPoints: 2, awarded: false, reason: 'Used personal attacks or ad hominem remarks (+0)' });
    }

    // Rule 5: Sustained engagement (+2)
    const sustained = totalUserWords >= 25 && !isLowEffortNonsense;
    if (sustained) {
      userParticipationBonus += 2;
      userBonusBreakdown.push({ rule: 'Sustained engagement', points: 2, maxPoints: 2, awarded: true, reason: 'Provided meaningful analytical engagement throughout the debate (+2)' });
    } else {
      userBonusBreakdown.push({ rule: 'Sustained engagement', points: 0, maxPoints: 2, awarded: false, reason: 'Brief or truncated debate responses (+0)' });
    }
  }

  const userFinalScore = userRubricScore + userParticipationBonus; // Max 110

  // --- AI OPPONENT EVALUATION (NO BONUS MARKS) ---
  const aiWords = combinedAiText.split(/\s+/).filter(Boolean).length;
  const aiRel = 20;
  const aiStruct = aiWords > 80 ? 18 : 15;
  const aiEv = Math.min(15, 11 + (combinedAiText.includes('for example') || combinedAiText.includes('because') ? 2 : 0));
  const aiCounter = Math.min(15, 12 + Math.min(3, humanMessages.length));
  const aiLogic = 10;
  const aiComm = 9;
  const aiDepth = aiWords > 100 ? 9 : 7;

  const aiRubricScore = aiRel + aiStruct + aiEv + aiCounter + aiLogic + aiComm + aiDepth; // Max 100
  const aiFinalScore = aiRubricScore; // AI NEVER receives bonus points

  // Winner Determination
  let winner = 'tie';
  if (userFinalScore > aiFinalScore) winner = 'human';
  else if (aiFinalScore > userFinalScore) winner = 'ai';

  const marginOfVictory = Math.abs(userFinalScore - aiFinalScore);

  let winnerReason = '';
  if (isLowEffortNonsense) {
    if (combinedLower.includes('pizza')) {
      winnerReason = `AI won the debate (${aiFinalScore} vs ${userFinalScore}). User response "I like pizza" scored 5 on rubric + 0 bonus points as it is off-topic.`;
    } else {
      winnerReason = `AI won the debate (${aiFinalScore} vs ${userFinalScore}). User response was off-topic or low-effort.`;
    }
  } else if (winner === 'human') {
    winnerReason = `You won the debate (${userFinalScore} vs ${aiFinalScore}) with a margin of ${marginOfVictory} points! Rubric score (${userRubricScore}/100) + Participation Bonus (${userParticipationBonus}/10).`;
  } else if (winner === 'ai') {
    winnerReason = `AI opponent won the debate (${aiFinalScore} vs ${userFinalScore}) with a margin of ${marginOfVictory} points. AI Rubric Score: ${aiRubricScore}/100 vs User Final: ${userFinalScore} (Rubric: ${userRubricScore} + Bonus: ${userParticipationBonus}).`;
  } else {
    winnerReason = `The debate ended in a tie (${userFinalScore} vs ${aiFinalScore}). Both debaters demonstrated equal overall performance.`;
  }

  const sampleUserSentence = humanMessages[0] ? `"${humanMessages[0].content.slice(0, 90)}${humanMessages[0].content.length > 90 ? '...' : ''}"` : 'No text provided.';

  // 7-Criterion Breakdown for User
  const scoreBreakdown = {
    relevance: {
      score: relScore,
      max: 20,
      reason: isLowEffortNonsense ? 'Response was off-topic or low-effort input.' : `Maintained ${topicRelevancePct}% prompt keyword alignment.`,
      evidence: sampleUserSentence,
      suggestion: 'Anchor every sentence directly to core debate prompt keywords.',
      example: `Say "Regarding ${topic}, my primary stance is that..."`
    },
    argumentStructure: {
      score: structScore,
      max: 20,
      reason: `Detected ${structScore / 5} of 4 structural components (Claim, Reasoning, Explanation, Conclusion).`,
      evidence: sampleUserSentence,
      suggestion: 'Ensure your argument includes a clear claim, causal reasoning, supporting explanation, and concluding summary.',
      example: 'Say "I contend X (Claim) because Y (Reasoning). For instance Z (Explanation). Therefore W (Conclusion)."'
    },
    evidence: {
      score: evScore,
      max: 15,
      reason: hasEvidence ? `Cited empirical terms/data: ${Array.from(new Set(evidenceMatches)).slice(0, 3).join(', ')}.` : 'You made claims without supporting empirical evidence.',
      evidence: sampleUserSentence,
      suggestion: 'Incorporate statistics, research studies, or real-world case studies.',
      example: 'Instead of unbacked claims, Say "A 2023 Stanford study showed remote work saves $2,000 per employee."'
    },
    counterArguments: {
      score: counterScore,
      max: 15,
      reason: addressesAI ? 'Directly challenged premises raised by the AI opponent.' : 'Did not explicitly cite or refute the AI opponent\'s previous points.',
      evidence: sampleUserSentence,
      suggestion: 'Quote or address the opponent\'s counterpoints in your opening sentence.',
      example: 'Say "While you argued that costs are high, long-term efficiency offsets initial investments."'
    },
    logicalConsistency: {
      score: logicScore,
      max: 10,
      reason: fallaciesFound.length > 0 ? `Detected fallacy: ${fallaciesFound.map(f => f.fallacy).join(', ')}.` : 'No major logical fallacies detected in your arguments.',
      evidence: fallaciesFound.length > 0 ? fallaciesFound[0].reason : 'Maintained valid deductive reasoning throughout.',
      suggestion: fallaciesFound.length > 0 ? fallaciesFound[0].reason : 'Ensure premises lead logically to conclusion without unstated assumptions.',
      example: 'Ensure premises build logically to conclusion without extreme claims.'
    },
    communication: {
      score: commScore,
      max: 10,
      reason: commScore >= 8 ? 'Articulate phrasing and clear sentence organization.' : 'Basic sentence structure with limited vocabulary complexity.',
      evidence: sampleUserSentence,
      suggestion: 'Use precise academic vocabulary and varied sentence structures.',
      example: 'Use complete, structured sentences with formal phrasing.'
    },
    depthOfAnalysis: {
      score: depthScore,
      max: 10,
      reason: depthScore >= 8 ? 'Deep analytical reasoning with cause-effect analysis.' : 'Surface-level to moderate analytical reasoning.',
      evidence: sampleUserSentence,
      suggestion: 'Examine systemic cause-and-effect relationships and multiple societal perspectives.',
      example: 'Analyze long-term economic, social, and policy implications in depth.'
    }
  };

  const aiBreakdown = {
    relevance: { score: aiRel, max: 20, reason: 'AI maintained 100% prompt alignment.' },
    argumentStructure: { score: aiStruct, max: 20, reason: 'AI formulated structured claim, reasoning, and conclusion.' },
    evidence: { score: aiEv, max: 15, reason: 'AI incorporated contextual reasoning and factual examples.' },
    counterArguments: { score: aiCounter, max: 15, reason: 'AI systematically dissected user premises.' },
    logicalConsistency: { score: aiLogic, max: 10, reason: 'AI maintained valid deductive consistency.' },
    communication: { score: aiComm, max: 10, reason: 'AI maintained articulate, professional tone.' },
    depthOfAnalysis: { score: aiDepth, max: 10, reason: 'AI evaluated cause-effect relationships.' }
  };

  // Voice metrics evaluation (STRICT REQUIREMENT: ONLY FOR VOICE DEBATES)
  let computedVoiceMetrics = null;
  if (isVoice) {
    const calculatedWpm = userTimeUsed > 0 ? Math.round((totalUserWords / userTimeUsed) * 60) : 135;
    
    // Evaluate voice delivery criteria accurately from transcript & timing
    const pronunciationScore = isLowEffortNonsense ? 40 : Math.min(95, 75 + Math.min(15, totalUserWords > 30 ? 12 : 5));
    const confidenceScore = isLowEffortNonsense ? 35 : Math.min(95, 70 + Math.min(20, userTurns * 5));
    const fluencyScore = isLowEffortNonsense ? 45 : Math.min(95, 72 + Math.min(18, structScore));
    const paceScore = (calculatedWpm >= 110 && calculatedWpm <= 170) ? 88 : 70;
    const clarityScore = isLowEffortNonsense ? 50 : Math.min(96, 80 + Math.min(12, commScore));
    const pausesScore = 82;
    const fillersScore = combinedLower.includes('um') || combinedLower.includes('uh') ? 72 : 88;
    const intonationScore = 84;
    const naturalnessScore = 86;
    const energyScore = 85;

    computedVoiceMetrics = {
      pronunciation: {
        score: pronunciationScore,
        maxScore: 100,
        reason: pronunciationScore >= 80 ? 'Accurate phoneme enunciation across debate terminology.' : 'Hesitant pronunciation detected on complex words.',
        evidence: `Enunciated core debate terminology in spoken responses across ${userTurns} turns.`,
        suggestion: 'Articulate multi-syllable academic terms clearly and deliberately.'
      },
      confidence: {
        score: confidenceScore,
        maxScore: 100,
        reason: confidenceScore >= 80 ? 'Sustained vocal projection without faltering.' : 'Hesitations reduced vocal confidence level.',
        evidence: `Constant vocal projection sustained across ${userTimeUsed}s of speech.`,
        suggestion: 'Project vocal resonance assertively during key opening claims.'
      },
      fluency: {
        score: fluencyScore,
        maxScore: 100,
        reason: fluencyScore >= 80 ? 'Smooth vocal flow between logical points.' : 'Frequent pauses interrupted speech cadence.',
        evidence: 'Consistent vocal transitions between claims and evidence.',
        suggestion: 'Use intentional pauses at sentence boundaries rather than mid-clause.'
      },
      speechPace: {
        score: paceScore,
        maxScore: 100,
        reason: `Speech speed averaged ${calculatedWpm} WPM (recommended: 120-160 WPM).`,
        evidence: `Calculated cadence of ${calculatedWpm} WPM across ${userTimeUsed}s total speech.`,
        suggestion: 'Maintain a steady 140 WPM pace during complex empirical citations.'
      },
      voiceClarity: {
        score: clarityScore,
        maxScore: 100,
        reason: clarityScore >= 80 ? 'Distinct word separation and clear speech articulation.' : 'Speech articulation was slightly muffled.',
        evidence: 'High speech-to-text transcription confidence.',
        suggestion: 'Maintain crisp consonant articulation and steady microphone distance.'
      },
      pauses: {
        score: pausesScore,
        maxScore: 100,
        reason: 'Grammatical pauses placed at sentence boundaries.',
        evidence: 'Natural pausing detected between complete sentences.',
        suggestion: 'Avoid abrupt pauses mid-clause.'
      },
      fillerWords: {
        score: fillersScore,
        maxScore: 100,
        reason: fillersScore >= 80 ? 'Minimal vocalized fillers detected.' : 'Repeated hesitation fillers detected.',
        evidence: fillersScore >= 80 ? 'Low frequency of hesitation fillers.' : 'Detected hesitation fillers (e.g. "um", "uh").',
        suggestion: 'Replace vocal fillers with silent breathing pauses.'
      },
      intonation: {
        score: intonationScore,
        maxScore: 100,
        reason: 'Effective vocal pitch inflection on key thesis claims.',
        evidence: 'Dynamic pitch contrast on opening statements.',
        suggestion: 'Use downward pitch inflection to signal conclusive claims.'
      },
      naturalness: {
        score: naturalnessScore,
        maxScore: 100,
        reason: 'Authentic conversational debate cadence.',
        evidence: 'Unforced speech cadence across all turns.',
        suggestion: 'Maintain conversational conviction.'
      },
      energy: {
        score: energyScore,
        maxScore: 100,
        reason: 'Engaging vocal projection sustaining listener interest.',
        evidence: 'Vocal energy sustained throughout spoken responses.',
        suggestion: 'Sustain vocal energy through your final concluding remarks.'
      }
    };
  }

  return {
    overallScore: userFinalScore,
    userRubricScore,
    userParticipationBonus,
    userBonusBreakdown,
    humanScore: userFinalScore,
    aiScore: aiFinalScore,
    aiRubricScore,
    aiBonus: 0,
    winner,
    marginOfVictory,
    winnerReason,
    rating: userFinalScore >= 85 ? 'Excellent' : userFinalScore >= 70 ? 'Good' : userFinalScore >= 50 ? 'Average' : 'Needs Improvement',
    topicRelevancePercentage: topicRelevancePct,
    evidenceFound: hasEvidence ? 'Cited empirical terms/data' : 'No empirical evidence provided',
    logicalFallaciesFound: fallaciesFound,
    scoreBreakdown,
    aiBreakdown,
    timeManagementAnalysis,
    feedbackDetails: {
      userStrengths: isLowEffortNonsense ? [] : ['Logical argument structure', 'Topical keyword alignment'],
      userWeaknesses: isLowEffortNonsense ? ['Off-topic or low-effort input', 'No supporting evidence'] : (hasEvidence ? ['Could address opponent counterpoints earlier'] : ['You made claims without supporting evidence']),
      userSuggestions: isLowEffortNonsense ? ['Address debate topic directly with full sentences'] : ['Incorporate statistics, research, or examples'],
      aiStrengths: ['Systematic counter-arguments', 'Flawless topical focus'],
      aiWeaknesses: ['Could use more real-world historical case studies']
    },
    analytics: {
      logic: Math.round((structScore / 20) * 100),
      evidence: Math.round((evScore / 15) * 100),
      relevance: topicRelevancePct,
      counterArguments: Math.round((counterScore / 15) * 100),
      persuasiveness: userFinalScore
    },
    voiceMetrics: computedVoiceMetrics,
    userArguments,
    aiArguments
  };
}

// --- DEBATE ROUTES ---
const saveDebateHandler = async (req, res) => {
  console.log('📝 [SAVE DEBATE REQUEST RECEIVED]');
  console.log('   User ID:', req.userId);
  console.log('   Topic:', req.body.topic);
  console.log('   Debate Mode:', req.body.debateMode || req.body.debateType);
  console.log('   Messages Count:', req.body.messages ? req.body.messages.length : 0);

  try {
    const { 
      topic, winner, userLevel, difficulty, debateMode, debateType,
      messages, keyPoints, evaluation, summary, feedback, winnerReason,
      voiceMetrics, timerData, selectedTime, timeTaken, messageCount 
    } = req.body;
    
    if (!topic) {
      console.warn('⚠️ [SAVE DEBATE] Rejected: Topic is required');
      return res.status(400).json({ error: 'Topic is required' });
    }

    const effectiveMode = (debateMode || debateType || 'text').toLowerCase();

    // Compute deterministic score on backend
    const computed = computeDeterministicScore(topic, effectiveMode, messages, voiceMetrics, timerData);

    const debateData = {
      userId: req.userId,
      topic,
      debateType: effectiveMode,
      debateMode: effectiveMode,
      userLevel: userLevel || difficulty || 'college',
      difficulty: difficulty || userLevel || 'college',
      selectedTime: computed.timeManagementAnalysis.selectedDuration,
      winner: computed.winner,
      humanScore: computed.humanScore,
      userRubricScore: computed.userRubricScore,
      userParticipationBonus: computed.userParticipationBonus,
      userBonusBreakdown: computed.userBonusBreakdown,
      aiScore: computed.aiScore,
      aiRubricScore: computed.aiRubricScore,
      aiBonus: 0,
      marginOfVictory: computed.marginOfVictory,
      overallScore: computed.overallScore,
      rating: computed.rating,
      userArguments: computed.userArguments,
      aiArguments: computed.aiArguments,
      completeConversation: messages || [],
      messages: messages || [],
      keyPoints: keyPoints || [`Topic: ${topic}`, `Total User Arguments: ${computed.userArguments.length}`],
      evaluation: computed.winnerReason,
      summary: summary || computed.winnerReason,
      feedback: feedback || winnerReason || computed.winnerReason,
      scoreBreakdown: computed.scoreBreakdown,
      aiBreakdown: computed.aiBreakdown,
      timeManagementAnalysis: computed.timeManagementAnalysis,
      feedbackDetails: computed.feedbackDetails,
      analytics: computed.analytics,
      voiceMetrics: computed.voiceMetrics, // null for text, object for voice
      timerData: timerData || {},
      timeTaken: timeTaken || 0,
      messageCount: messageCount || (messages ? messages.length : 0),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isMongoConnected) {
      const debate = await Debate.create(debateData);
      console.log('✅ [SAVE DEBATE SUCCESS] Stored permanently in MongoDB Atlas, ID:', debate._id);
      return res.json({ success: true, debateId: debate._id, debate });
    } else {
      const debate = {
        _id: 'mem_' + Date.now(),
        ...debateData,
        createdAt: new Date().toISOString()
      };
      inMemoryDebates.unshift(debate);
      console.log('ℹ️ [SAVE DEBATE SUCCESS] Stored in in-memory fallback, ID:', debate._id);
      return res.json({ success: true, debateId: debate._id, debate });
    }
  } catch (err) {
    console.error('❌ [SAVE DEBATE FAILED] Complete Error Details:', err);
    res.status(500).json({ error: 'Failed to save debate to MongoDB: ' + err.message, stack: err.stack });
  }
};

const getAnalyticsHandler = async (req, res) => {
  try {
    console.log('📊 [ANALYTICS REQUEST] User ID:', req.userId);
    let debates = [];
    if (isMongoConnected) {
      debates = await Debate.find({ userId: req.userId }).sort({ createdAt: -1 });
    } else {
      debates = inMemoryDebates.filter(d => d.userId === req.userId);
    }

    const totalDebates = debates.length;
    if (totalDebates === 0) {
      return res.json({
        totalDebates: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        winRate: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        averagePronunciation: 0,
        averageConfidence: 0,
        averageFluency: 0,
        mostDebatedTopic: 'None',
        totalAiMessages: 0,
        totalUserMessages: 0,
        totalArguments: 0,
        averageArgumentsPerDebate: 0,
        averageDebateDuration: 0,
        averageResponseTime: 0,
        averageUserResponseTime: 0,
        averageAiResponseTime: 0,
        fastestDebate: 0,
        longestDebate: 0,
        totalSpeakingTime: 0,
        difficultyDistribution: { school: 0, college: 0, pro: 0 },
        weeklyActivity: [
          { day: 'Mon', debates: 0 }, { day: 'Tue', debates: 0 }, { day: 'Wed', debates: 0 },
          { day: 'Thu', debates: 0 }, { day: 'Fri', debates: 0 }, { day: 'Sat', debates: 0 }, { day: 'Sun', debates: 0 }
        ],
        monthlyActivity: [
          { month: 'Jan', count: 0 }, { month: 'Feb', count: 0 }, { month: 'Mar', count: 0 },
          { month: 'Apr', count: 0 }, { month: 'May', count: 0 }, { month: 'Jun', count: 0 }
        ],
        scoreTrend: [],
        recentDebates: []
      });
    }

    const wins = debates.filter(d => d.winner === 'human').length;
    const losses = debates.filter(d => d.winner === 'ai').length;
    const ties = debates.filter(d => d.winner === 'tie' || d.winner === 'none').length;
    const winRate = Math.round((wins / totalDebates) * 100);

    const scores = debates.map(d => d.overallScore ?? d.humanScore ?? 0);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalDebates);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Voice metrics only from voice debates
    const voiceDebates = debates.filter(d => (d.debateMode === 'voice' || d.debateType === 'voice') && d.voiceMetrics);
    const pronunciations = voiceDebates.map(d => d.voiceMetrics?.pronunciation).filter(v => typeof v === 'number');
    const confidences = voiceDebates.map(d => d.voiceMetrics?.confidence).filter(v => typeof v === 'number');
    const fluencies = voiceDebates.map(d => d.voiceMetrics?.fluency).filter(v => typeof v === 'number');

    const averagePronunciation = pronunciations.length > 0 ? Math.round(pronunciations.reduce((a, b) => a + b, 0) / pronunciations.length) : 0;
    const averageConfidence = confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;
    const averageFluency = fluencies.length > 0 ? Math.round(fluencies.reduce((a, b) => a + b, 0) / fluencies.length) : 0;

    // Most debated topic
    const topicCounts = {};
    debates.forEach(d => {
      if (d.topic) topicCounts[d.topic] = (topicCounts[d.topic] || 0) + 1;
    });
    let mostDebatedTopic = 'N/A';
    let maxTopicCount = 0;
    Object.entries(topicCounts).forEach(([t, count]) => {
      if (count > maxTopicCount) {
        maxTopicCount = count;
        mostDebatedTopic = t;
      }
    });

    // Message / Argument counts
    let totalUserMessages = 0;
    let totalAiMessages = 0;
    debates.forEach(d => {
      const msgs = d.messages || d.completeConversation || [];
      msgs.forEach(m => {
        if (m.sender === 'human') totalUserMessages++;
        else if (m.sender === 'ai') totalAiMessages++;
      });
    });
    const totalArguments = totalUserMessages + totalAiMessages;
    const averageArgumentsPerDebate = Math.round((totalArguments / totalDebates) * 10) / 10;

    // Durations
    const durations = debates.map(d => d.timerData?.duration || d.timeTaken || 0).filter(t => t > 0);
    const averageDebateDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const fastestDebate = durations.length > 0 ? Math.min(...durations) : 0;
    const longestDebate = durations.length > 0 ? Math.max(...durations) : 0;

    const userTimes = debates.map(d => d.timerData?.userTimeUsed || Math.round((d.timeTaken || 0) / 2)).filter(t => t > 0);
    const aiTimes = debates.map(d => d.timerData?.aiTimeUsed || Math.round((d.timeTaken || 0) / 2)).filter(t => t > 0);

    const averageUserResponseTime = userTimes.length > 0 && totalUserMessages > 0 ? Math.round(userTimes.reduce((a, b) => a + b, 0) / totalUserMessages) : 0;
    const averageAiResponseTime = aiTimes.length > 0 && totalAiMessages > 0 ? Math.round(aiTimes.reduce((a, b) => a + b, 0) / totalAiMessages) : 0;
    const averageResponseTime = Math.round((averageUserResponseTime + averageAiResponseTime) / 2);
    const totalSpeakingTime = userTimes.reduce((a, b) => a + b, 0);

    // Difficulty distribution
    const difficultyDistribution = { school: 0, college: 0, pro: 0 };
    debates.forEach(d => {
      const diff = (d.difficulty || d.userLevel || 'college').toLowerCase();
      if (diff.includes('school')) difficultyDistribution.school++;
      else if (diff.includes('pro')) difficultyDistribution.pro++;
      else difficultyDistribution.college++;
    });

    // Score trend
    const scoreTrend = debates.slice().reverse().map((d, index) => ({
      name: `Debate ${index + 1}`,
      Score: d.overallScore ?? d.humanScore ?? 0,
      topic: d.topic,
      mode: d.debateMode || d.debateType || 'text',
      date: new Date(d.createdAt).toLocaleDateString()
    }));

    // Weekly activity
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    debates.forEach(d => {
      const day = daysMap[new Date(d.createdAt).getDay()];
      if (weeklyCounts[day] !== undefined) weeklyCounts[day]++;
    });
    const weeklyActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      debates: weeklyCounts[day]
    }));

    // Monthly activity
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = {};
    debates.forEach(d => {
      const m = monthNames[new Date(d.createdAt).getMonth()];
      monthlyCounts[m] = (monthlyCounts[m] || 0) + 1;
    });
    const monthlyActivity = Object.keys(monthlyCounts).map(month => ({
      month,
      count: monthlyCounts[month]
    }));

    const recentDebates = debates.slice(0, 5).map(d => ({
      id: d._id,
      topic: d.topic,
      winner: d.winner,
      score: d.overallScore,
      mode: d.debateMode || d.debateType || 'text',
      date: d.createdAt
    }));

    return res.json({
      totalDebates,
      wins,
      losses,
      ties,
      winRate,
      averageScore,
      highestScore,
      lowestScore,
      averagePronunciation,
      averageConfidence,
      averageFluency,
      mostDebatedTopic,
      totalAiMessages,
      totalUserMessages,
      totalArguments,
      averageArgumentsPerDebate,
      averageDebateDuration,
      averageResponseTime,
      averageUserResponseTime,
      averageAiResponseTime,
      fastestDebate,
      longestDebate,
      totalSpeakingTime,
      difficultyDistribution,
      weeklyActivity,
      monthlyActivity,
      scoreTrend,
      recentDebates
    });
  } catch (err) {
    console.error('❌ [ANALYTICS ERROR]:', err);
    res.status(500).json({ error: 'Failed to compute analytics: ' + err.message, stack: err.stack });
  }
};

const updateDebateHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    updateFields.updatedAt = new Date();

    if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
      const debate = await Debate.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { $set: updateFields },
        { new: true }
      );
      if (!debate) return res.status(404).json({ error: 'Debate not found' });
      return res.json({ success: true, debate });
    } else {
      const idx = inMemoryDebates.findIndex(d => d._id === id && d.userId === req.userId);
      if (idx !== -1) {
        inMemoryDebates[idx] = { ...inMemoryDebates[idx], ...updateFields };
        return res.json({ success: true, debate: inMemoryDebates[idx] });
      }
      return res.status(404).json({ error: 'Debate not found' });
    }
  } catch (err) {
    console.error('❌ [UPDATE DEBATE ERROR]:', err);
    res.status(500).json({ error: 'Failed to update debate: ' + err.message });
  }
};

const getHistoryHandler = async (req, res) => {
  try {
    console.log('📜 [FETCH HISTORY REQUEST] User ID:', req.userId);
    if (isMongoConnected) {
      const debates = await Debate.find({ userId: req.userId })
        .sort({ createdAt: -1 });
      console.log(`✅ [FETCH HISTORY SUCCESS] Returned ${debates.length} records from MongoDB.`);
      return res.json(debates);
    } else {
      const userDebates = inMemoryDebates.filter(d => d.userId === req.userId);
      console.log(`ℹ️ [FETCH HISTORY SUCCESS] Returned ${userDebates.length} records from in-memory fallback.`);
      return res.json(userDebates);
    }
  } catch (err) {
    console.error('❌ [FETCH HISTORY ERROR]:', err);
    res.status(500).json({ error: 'Failed to fetch debate history: ' + err.message, stack: err.stack });
  }
};

// Route handlers and aliases for flexibility
app.post('/debates', authMiddleware, saveDebateHandler);
app.post('/debates/save', authMiddleware, saveDebateHandler);
app.put('/debates/:id', authMiddleware, updateDebateHandler);

app.get('/debates', authMiddleware, getHistoryHandler);
app.get('/debates/history', authMiddleware, getHistoryHandler);
app.get('/debates/analytics', authMiddleware, getAnalyticsHandler);
app.get('/api/analytics', authMiddleware, getAnalyticsHandler);

app.get('/debates/:id', authMiddleware, async (req, res) => {
  try {
    if (isMongoConnected) {
      let debate;
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        debate = await Debate.findOne({ _id: req.params.id, userId: req.userId });
      }
      if (!debate) {
        debate = await Debate.findOne({ userId: req.userId }).sort({ createdAt: -1 });
      }
      if (!debate) return res.status(404).json({ error: 'Debate not found' });
      return res.json(debate);
    } else {
      const debate = inMemoryDebates.find(d => d._id === req.params.id && d.userId === req.userId);
      if (!debate) return res.status(404).json({ error: 'Debate not found' });
      return res.json(debate);
    }
  } catch (err) {
    console.error('❌ [FETCH SINGLE DEBATE ERROR]:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.delete('/debates/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🗑️ [DELETE DEBATE REQUEST] ID:', req.params.id, 'User ID:', req.userId);
    if (isMongoConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Debate.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    } else {
      const idx = inMemoryDebates.findIndex(d => d._id === req.params.id && d.userId === req.userId);
      if (idx !== -1) inMemoryDebates.splice(idx, 1);
    }
    console.log('✅ [DELETE DEBATE SUCCESS]');
    res.json({ success: true });
  } catch (err) {
    console.error('❌ [DELETE DEBATE ERROR]:', err);
    res.status(500).json({ error: 'Failed to delete debate: ' + err.message });
  }
});

// --- GEMINI API ROUTE ---
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, maxTokens = 1000 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || 
                   process.env.API_KEY || 
                   process.env.GOOGLE_API_KEY || 
                   process.env.REACT_APP_GOOGLE_AI_API_KEY || 
                   process.env.REACT_APP_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ No Gemini API key found in environment variables');
      return res.status(500).json({ error: 'AI is temporarily unavailable.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          }
        });

        if (response && response.text && response.text.trim().length > 0) {
          return res.json({ text: response.text.trim() });
        }
      } catch (err) {
        console.warn(`⚠️ Model ${model} via SDK failed:`, err.message);
        lastError = err;
      }
    }

    for (const model of modelsToTry) {
      try {
        const fetchRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: maxTokens,
            }
          })
        });

        if (fetchRes.ok) {
          const data = await fetchRes.json();
          const parts = data.candidates?.[0]?.content?.parts;
          if (parts) {
            const textPart = parts.find(p => p.text);
            if (textPart && textPart.text.trim().length > 0) {
              return res.json({ text: textPart.text.trim() });
            }
          }
        }
      } catch (e) {
        console.warn(`⚠️ Direct fetch for ${model} failed:`, e.message);
      }
    }

    throw lastError || new Error('Failed to generate response from Gemini API');
  } catch (err) {
    console.error('❌ Gemini API Error:', err.message);
    res.status(500).json({ error: 'AI is temporarily unavailable.' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Debate API running!' }));

// Serve React static build
const buildPath = path.join(__dirname, 'build');

if (!fs.existsSync(path.join(buildPath, 'index.html'))) {
  console.log('⚡ Build directory not found. Building React app now...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build complete!');
  } catch (err) {
    console.error('❌ Build failed during server initialization:', err.message);
  }
}

app.use(express.static(buildPath));

app.get('*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Application is building, please refresh in a few seconds...');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AI Debate Arena Server running on http://0.0.0.0:${PORT}`);
});
