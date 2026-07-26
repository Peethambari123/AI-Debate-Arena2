<div align="center">

# ⚔️ AI Debate Arena

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=for-the-badge&logo=github)](https://github.com/Peethambari123/AI-Debate-Arena2)
[![Deployment](https://img.shields.io/badge/Render-Deployed-000000.svg?style=for-the-badge&logo=render&logoColor=white)](https://ai-debate-backend-o9rt.onrender.com/)
[![Database](https://img.shields.io/badge/MongoDB_Atlas-Connected-47A248.svg?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)
[![AI Engine](https://img.shields.io/badge/Google_Gemini-3.6_Flash-4285F4.svg?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Educational-blue.svg?style=for-the-badge)](https://github.com/Peethambari123/AI-Debate-Arena2)

### *An Intelligent, Real-Time AI-Powered Structured Debate & Rhetorical Analytics Platform*

**Master the art of persuasion, critical thinking, and structured argument generation against an adaptive LLM debater.**

[🚀 Live Demo](https://ai-debate-backend-o9rt.onrender.com/) • [📂 GitHub Repository](https://github.com/Peethambari123/AI-Debate-Arena2) • [🐛 Report Bug](https://github.com/Peethambari123/AI-Debate-Arena2/issues) • [✨ Request Feature](https://github.com/Peethambari123/AI-Debate-Arena2/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
  - [Why It Was Built](#why-it-was-built)
  - [Problem Statement](#problem-statement)
  - [Objectives](#objectives)
  - [Benefits](#benefits)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Workflow](#-workflow)
- [Project Structure](#-project-structure)
- [Authentication Flow](#-authentication-flow)
- [AI Debate Flow](#-ai-debate-flow)
- [AI Evaluation Criteria](#-ai-evaluation-criteria)
- [Analytics Dashboard](#-analytics-dashboard)
- [Debate History](#-debate-history)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [API Endpoints](#-api-endpoints)
- [Challenges Faced](#-challenges-faced)
- [Key Learnings](#-key-learnings)
- [Future Enhancements](#-future-enhancements)
- [Developer](#-developer)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)
- [Acknowledgements](#-acknowledgements)

---

## 🌐 Overview

**AI Debate Arena** is an advanced, full-stack web application engineered to elevate human debate skills through real-time interaction with an intelligent, adaptive AI opponent powered by **Google Gemini**.

Whether preparing for formal competitive debate leagues, polishing public speaking skills, or honing logical reasoning, users can engage in timed debates using either **voice** or **text** mode. The platform evaluates performance across key rhetorical dimensions, providing objective scoring, logical fallacy detection, counter-argument breakdowns, and detailed statistical analytics over time.

### Why It Was Built
Competitive debating and public speaking training traditionally require human debate partners, certified judges, and dedicated practice spaces. Finding immediate, objective feedback on logical consistency and rebuttal power can be challenging. **AI Debate Arena** was built to democratize access to high-tier debate training by providing an always-available, highly competent AI opponent capable of adapting to varying difficulty levels.

### Problem Statement
- **Lack of On-Demand Practice Partners:** Human debate practice requires scheduling with partners of similar skill levels.
- **Subjective Feedback:** Human judges often bring unconscious bias, making objective performance tracking difficult.
- **Inaccessible Voice Integration:** Most AI chat platforms rely solely on text, ignoring oral delivery and spontaneous counter-arguing.
- **Scarcity of Analytical Tracking:** Traditional debate prep rarely offers quantitative tracking of win rates, average rhetoric scores, and logical consistency over extended periods.

### Objectives
1. Provide an adaptive, real-time AI debate partner capable of multi-turn counter-arguments.
2. Integrate native voice recognition and speech synthesis for immersive speech practice.
3. Deliver comprehensive quantitative scoring across 6 distinct rhetorical parameters.
4. Maintain persistent user profiles, analytics dashboards, and historical debate replays using MongoDB Atlas.
5. Offer secure dual-authentication via JWT and Google OAuth 2.0.

### Benefits
- **Immediate Rhetorical Feedback:** Receive multi-parameter feedback instantly after concluding a debate.
- **Voice & Text Flexibility:** Practice verbal articulation with speech recognition or structured writing via text.
- **Scalable Difficulty:** Challenge yourself across **School**, **College**, or **Professional** AI difficulty modes.
- **Data-Driven Progress:** Track performance metrics, score progressions, and debate statistics over time.

---

## ✨ Key Features

### 🔐 Authentication & Profile Management
- **JWT Authentication:** Secure token-based user registration, login, session validation, and password resetting using bcrypt hashing.
- **Google OAuth 2.0 Integration:** Seamless single-click authentication powered by Passport.js and Google OAuth credentials.
- **Custom Profile Editor:** Update user full names, custom usernames, avatar picture URLs, or select from built-in avatar presets.
- **Protected Client Routes:** Route protection guarding private dashboard views, debate arenas, and profile settings.

### 🤖 AI Debate Engine & Speech Interaction
- **Adaptive Gemini AI Opponent:** Real-time counter-arguments driven by Google Gemini API with custom system prompts tuned for structured rebuttal.
- **Dual Communication Modes:**
  - **Text Mode:** Full-featured markdown input with real-time word counter and formatting support.
  - **Voice Mode:** Real-time Web Speech API recognition (Speech-to-Text) and natural Speech Synthesis (Text-to-Speech) for spoken debate rounds.
- **Customizable Debate Settings:** Choose from predefined topics or input custom propositions; select debate durations (1 to 60 minutes) and difficulty levels.
- **Dynamic Debate Timer:** Real-time countdown timer enforcing formal turn limits and round conclusions.

### 📊 Comprehensive Evaluation & Analytics Dashboard
- **6-Point AI Rhetorical Evaluation:** Multi-factor scoring assessing Topic Relevance, Argument Quality, Evidence Usage, Counter-Arguments, Logical Consistency, and Communication Style.
- **Winner Declaration & Key Insights:** Automatic match winner determination accompanied by key strengths, weaknesses, and recommended improvements.
- **Analytics Dashboard:** Visual performance graphs generated via Recharts including total debates, win rate percentages, average score progression, and topic distribution.
- **Historical Debate Archive:** Persistent MongoDB database storing past debates with full transcript replays, score breakdowns, and deletion capabilities.

---

## 📸 Screenshots

> *Replace the placeholder image paths below with actual screenshot links or local images inside your repository.*

| Landing Page | Login Page |
| :---: | :---: |
| ![Landing Page](https://via.placeholder.com/600x350/0f172a/60a5fa?text=AI+Debate+Arena+Landing+Page) | ![Login Page](https://via.placeholder.com/600x350/0f172a/60a5fa?text=Secure+JWT+%26+Google+OAuth) |

| Interactive Debate Arena | Analytics Dashboard |
| :---: | :---: |
| ![Debate Arena](https://via.placeholder.com/600x350/0f172a/60a5fa?text=Live+Voice+%26+Text+Debate+Arena) | ![Analytics Dashboard](https://via.placeholder.com/600x350/0f172a/60a5fa?text=Recharts+Performance+Analytics) |

| Score Evaluation Breakdown | Debate History Archive |
| :---: | :---: |
| ![Evaluation Breakdown](https://via.placeholder.com/600x350/0f172a/60a5fa?text=AI+Rhetorical+Score+Breakdown) | ![Debate History](https://via.placeholder.com/600x350/0f172a/60a5fa?text=Persistent+Debate+History) |

---

## 🛠️ Tech Stack

### Frontend Architecture

| Category | Technology | Usage Description |
| :--- | :--- | :--- |
| **Framework** | **React.js (v18)** | Component-based UI rendering and client state management |
| **Styling** | **Tailwind CSS** | Utility-first, high-contrast dark theme responsive design |
| **Animations** | **Framer Motion** | Smooth visual transitions and interactive feedback |
| **Data Viz** | **Recharts** | Interactive line charts, bar graphs, and score distribution pie charts |
| **Icons** | **Lucide React** | Clean vector iconography across navigation and controls |
| **Speech STT** | **Web Speech API** | Native Web SpeechRecognition for real-time voice input |
| **Speech TTS** | **SpeechSynthesis API** | Native browser text-to-speech engine for spoken AI counter-arguments |

### Backend Architecture

| Category | Technology | Usage Description |
| :--- | :--- | :--- |
| **Runtime** | **Node.js** | Asynchronous server runtime environment |
| **Framework** | **Express.js** | Modular RESTful API route handling and middleware dispatching |
| **Database** | **MongoDB Atlas** | Managed cloud NoSQL database for accounts and debate transcripts |
| **ORM / ODM** | **Mongoose** | Schema validation, sparse indexing, and aggregation pipelines |
| **Auth Engine** | **JWT & Passport.js** | JSON Web Token verification & Google OAuth 2.0 strategy |
| **Encryption** | **bcrypt.js** | Salted password hashing prior to persistence |
| **Security / CORS**| **CORS & dotenv** | Cross-Origin Resource Sharing control and secret environment protection |
| **Hosting** | **Render** | Cloud hosting service running full-stack web backend service |

---

## 🏗️ System Architecture

The following Mermaid diagram illustrates the data flow and system architecture between the client, backend server, authentication providers, MongoDB database, and Google Gemini AI services:

```mermaid
graph TD
    subgraph Client ["Client Layer (React.js)"]
        UI[User Interface / React Router]
        STT[Web Speech API - Speech-to-Text]
        TTS[SpeechSynthesis API - Text-to-Speech]
        State[React State & Hooks]
    end

    subgraph Backend ["Server Layer (Node.js & Express.js)"]
        Server[Express Server / server.js]
        AuthMW[Auth Middleware - JWT]
        PassStrategy[Passport.js Google OAuth]
        Routes[API Routes: /auth, /debates, /api/gemini]
    end

    subgraph External ["External Services & Databases"]
        Mongo[(MongoDB Atlas Cloud DB)]
        Gemini[Google Gemini 3.6 Flash API]
        GoogleAuth[Google OAuth 2.0 Service]
    end

    UI -->|HTTP Requests / REST| Server
    STT -->|Voice Transcripts| State
    State -->|Debate Payloads| UI
    
    Server --> AuthMW
    AuthMW --> Routes
    
    Routes -->|User & Debate Records| Mongo
    Routes -->|Prompt Engineering & Evaluation| Gemini
    Server -->|OAuth Handshake| GoogleAuth
    GoogleAuth -->|Token Callback| PassStrategy
    
    TTS <--|Audio Synthesis| UI
```

---

## 🔄 Workflow

```
[User Registration / Google Login]
               │
               ▼
   [Select / Enter Topic] ──► [Choose Difficulty & Duration]
               │
               ▼
    [Launch Debate Arena] ──► [Select Mode: Text or Voice]
               │
               ▼
 [User Submits Argument] ──► [Express Proxy Endpoint]
               │                      │
               ▼                      ▼
  [AI Reads Speech TTS] ◄── [Google Gemini Generates Response]
               │
               ▼
 [Timer Reaches Expiry] ──► [Trigger AI Final Evaluation]
               │
               ▼
 [Generate Multi-Factor Score] ──► [Save Transcript to MongoDB Atlas]
               │
               ▼
  [Update Analytics Dashboard] ◄── [Render Score Breakdown]
```

---

## 📁 Project Structure

```
AI-Debate-Arena2/
├── public/
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Dashboard.js              # Analytics overview & Recharts visualizations
│   │   ├── DebateApp.js              # Core debate engine (Text & Voice interaction)
│   │   ├── ForgotPasswordPage.js     # Account password recovery & reset
│   │   ├── HistoryPage.js             # Historical debate list & replay modal
│   │   ├── LandingPage.js             # Hero presentation & platform features
│   │   ├── LoginPage.js               # JWT login form & Google OAuth trigger
│   │   ├── Navbar.js                  # Sticky responsive header & session state
│   │   ├── ProfilePage.js             # User account editor, avatar picker & password update
│   │   ├── RegisterPage.js            # User signup form & validation
│   │   └── ScoreBreakdownView.js      # Graphical 6-factor score breakdown viewer
│   ├── utils/
│   │   ├── aiService.js               # Base URL helper exports
│   │   └── apiConfig.js               # Centralized Render API URL constructor
│   ├── App.css                        # Tailwind CSS imports & custom styles
│   ├── App.js                         # Top-level state, session router & protected tabs
│   └── index.js                       # React application entry point
├── config/
│   └── passport.js                    # Passport Google OAuth Strategy setup
├── middleware/
│   └── authMiddleware.js              # JWT Bearer token authentication middleware
├── models/
│   ├── User.js                        # Mongoose User schema (sparse googleId index)
│   └── Debate.js                      # Mongoose Debate schema (history & scores)
├── routes/
│   ├── auth.js                        # Registration, login, profile, & password routes
│   └── debates.js                     # Debate persistence, analytics, & deletion routes
├── .env.example                       # Template for local environment configuration
├── .gitignore                         # Excluded dependencies and runtime environment files
├── package.json                       # Client & server npm dependencies
├── README.md                          # Repository documentation
└── server.js                          # Express server entry point & MongoDB Atlas connection
```

---

## 🔑 Authentication Flow

```
+-----------------------------------------------------------------------------------+
|                               AUTHENTICATION FLOW                                 |
+-----------------------------------------------------------------------------------+

[Option A: Email & Password]
 1. User enters Full Name, Username, Email, and Password.
 2. Frontend posts payload to getApiUrl('/auth/register').
 3. Backend verifies uniqueness in MongoDB Atlas & in-memory cache.
 4. Password is hashed using bcrypt (10 salt rounds).
 5. User document created in MongoDB Atlas with sparse googleId index.
 6. JWT token signed with 7-day expiration (`JWT_SECRET`).
 7. Bearer token returned and saved to browser `localStorage`.

[Option B: Google OAuth 2.0]
 1. User clicks "Sign in with Google".
 2. Frontend redirects to `getApiUrl('/auth/google')`.
 3. Passport.js handles redirect to Google Consent Screen.
 4. Google returns authorization code to `/auth/google/callback`.
 5. User matched by `googleId` or `email` in MongoDB Atlas.
 6. JWT signed and returned via query parameters to the React client.

[Protected Routes & Session Maintenance]
 1. On application load, client reads stored token from `localStorage`.
 2. Sends `GET /auth/me` with `Authorization: Bearer <TOKEN>` header.
 3. Auth middleware validates JWT signature and attaches `req.userId`.
 4. Fresh profile loaded; invalid tokens automatically purged.
```

---

## 🤖 AI Debate Flow

1. **Setup Phase:** User selects a topic, difficulty level (*School*, *College*, or *Professional*), duration timer, and side (*For* or *Against*).
2. **Turn Generation:** User submits an argument through typing or Web Speech recognition.
3. **API Proxy Dispatch:** React app sends the request payload to the Express server proxy endpoint (`/api/gemini`).
4. **Prompt Engineering:** Server crafts a system prompt instructing Gemini to:
   - Adopt the persona of a skilled debater holding the opposing stance.
   - Address weaknesses in the user's latest claim.
   - Maintain appropriate language complexity based on difficulty mode.
   - Limit response length to ensure conversational rhythm.
5. **Real-time Counter-Argument:** Gemini returns the structured rebuttal, rendered in the chat feed and spoken aloud via SpeechSynthesis.
6. **Final Judgment:** When the timer expires, a final evaluation prompt is sent to Gemini to analyze the complete transcript and return a structured JSON evaluation object.

---

## ⚖️ AI Evaluation Criteria

At the conclusion of each debate, the argument transcript undergoes holistic analysis across **6 distinct criteria** (scored 0-100%):

| Criteria | Description & Evaluation Focus |
| :--- | :--- |
| **Topic Relevance** | Measures how consistently arguments directly address the core motion without diverting off-topic. |
| **Argument Quality** | Assesses clarity, depth, logical construction, and premise validity of claims presented. |
| **Evidence & Facts** | Evaluates concrete examples, empirical data, logical proofs, and illustrations cited. |
| **Counter-Arguments** | Measures effectiveness in identifying, dismantling, and refuting the opponent's claims. |
| **Logical Consistency** | Detects absence of contradictions, fallacies (e.g., ad hominem, straw man, slippery slope), and circular reasoning. |
| **Communication & Style** | Evaluates persuasion, rhetorical poise, vocabulary choice, and delivery structure. |

### Scoring & Outcome Determination
- **Cumulative Score:** Weighted average of all 6 individual metrics.
- **Match Outcome:**
  - **Win:** Cumulative score exceeds AI baseline performance for chosen difficulty.
  - **Loss:** Cumulative score falls below AI baseline.
  - **Tie:** Scores match within margin of error.
- **Feedback Highlights:** Provides 3 actionable strengths and 3 key growth areas for future practice.

---

## 📈 Analytics Dashboard

The **Analytics Dashboard** aggregates historical debate metadata from MongoDB Atlas to deliver visual performance insights:

- **Key Metrics Summary Cards:**
  - **Total Debates Completed:** Lifetime matches logged.
  - **Win / Loss Ratio & Rate:** Percentage win frequency visualization.
  - **Average Score:** Overall mean rhetorical performance.
  - **Highest Score:** Peak match score recorded.
- **Visual Recharts Graphs:**
  - **Score Progression Line Chart:** Timeline tracking score growth across matches.
  - **Category Breakdown Radar/Bar Chart:** Comparative performance across the 6 evaluation factors.
  - **Topic Distribution Pie Chart:** Frequency analysis of debated subject domains.

---

## 📜 Debate History

- **Persistent Storage:** Transcripts, turn counts, difficulty settings, and score breakdowns are recorded directly to MongoDB Atlas.
- **Interactive Replay:** Click on any historical debate record to open a full modal replay showing the entire turn-by-turn dialogue.
- **Search & Filtering:** Search historical debates by topic keyword or filter by match outcome (Win/Loss).
- **Record Management:** Individual debate records can be permanently deleted from user history.

---

## ⚡ Installation & Setup

### Prerequisites

Ensure you have the following installed locally:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas)
- [Google AI Studio Gemini API Key](https://aistudio.google.com/)

---

### Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Peethambari123/AI-Debate-Arena2.git
cd AI-Debate-Arena2
```

#### 2. Install Dependencies
Install all required client and server npm dependencies:
```bash
npm install
```

#### 3. Configure Environment Variables
Create a `.env` file in the root directory by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in your credentials (see [Environment Variables](#-environment-variables) section below).

#### 4. Run the Application
Start the development server:
```bash
npm start
```
The Express backend server and React interface run seamlessly on `http://localhost:3000`.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Port Configuration
PORT=3000

# MongoDB Atlas Database URI
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ai_debate_arena?retryWrites=true&w=majority

# JWT & Session Secrets
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
SESSION_SECRET=your_super_secret_session_key_here_min_32_chars

# Google Gemini API Key
GEMINI_API_KEY=your_google_gemini_api_key

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Frontend Application URL (Render Backend Domain)
REACT_APP_API_URL=https://ai-debate-backend-o9rt.onrender.com
CLIENT_URL=https://ai-debate-backend-o9rt.onrender.com
```

---

## 🚀 Deployment

The application is fully configured for continuous deployment on **Render**.

### Backend & Service Setup on Render

1. **Connect Repository:** Log in to [Render Dashboard](https://dashboard.render.com/) and create a new **Web Service** connected to `https://github.com/Peethambari123/AI-Debate-Arena2`.
2. **Environment & Runtime:**
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. **Environment Variables:** Add all variables defined in `.env` (`MONGO_URI`, `JWT_SECRET`, `SESSION_SECRET`, `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REACT_APP_API_URL`).
4. **MongoDB Atlas Network Access:** In MongoDB Atlas, ensure **Network Access** includes `0.0.0.0/0` (Allow Access from Anywhere) so Render dynamic IP addresses can connect securely.

---

## 📡 API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/register` | Register a new user account | ❌ No |
| `POST` | `/auth/login` | Authenticate with email/username & password | ❌ No |
| `GET` | `/auth/google` | Initiate Google OAuth 2.0 flow | ❌ No |
| `GET` | `/auth/google/callback` | Google OAuth redirect callback | ❌ No |
| `GET` | `/auth/me` | Fetch active user session metadata | YES (JWT) |
| `PUT` | `/auth/profile` | Update profile details, username, or avatar | YES (JWT) |
| `PUT` | `/auth/password` | Change user password | YES (JWT) |
| `POST` | `/auth/forgot-password` | Request password reset code | ❌ No |
| `POST` | `/auth/reset-password` | Reset password using verified code | ❌ No |
| `POST` | `/auth/logout` | Terminate session | YES (JWT) |

### AI & Debate Routes (`/debates` & `/api`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/gemini` | Proxy request to Google Gemini API | ❌ Optional |
| `POST` | `/debates/save` | Save completed debate transcript & scores | YES (JWT) |
| `GET` | `/debates/history` | Retrieve user debate history | YES (JWT) |
| `GET` | `/debates/analytics` | Fetch aggregated analytics & performance stats | YES (JWT) |
| `DELETE` | `/debates/:id` | Delete a specific debate record | YES (JWT) |

---

## 🛠️ Challenges Faced

1. **MongoDB Atlas Sparse Indexing for Google OAuth:**
   - *Challenge:* Non-OAuth users registering via email/password caused a `MongoServerError: E11000 duplicate key error collection: test.users index: googleId_1 dup key: { googleId: null }` because multiple documents held `null` values under a standard unique index.
   - *Solution:* Updated Mongoose `UserSchema` to treat `googleId` as a `sparse: true` index and added an automated server startup index cleanup handler dropping legacy indexes.
2. **Web Speech API Browser Compatibility:**
   - *Challenge:* Inconsistent continuous speech recognition behavior across non-Chromium browsers.
   - *Solution:* Implemented graceful fallbacks, state indicators, manual text editing overlays, and browser compatibility checks guiding users.
3. **Structured JSON Parsing from Gemini Evaluation:**
   - *Challenge:* Generative AI models occasionally wrap JSON outputs in extra markdown formatting (e.g. ````json ... ````), leading to client JSON parsing exceptions.
   - *Solution:* Created robust regex extraction sanitizer routines isolating raw JSON strings prior to parsing evaluation objects.
4. **Dynamic API Routing Across Deployments:**
   - *Challenge:* Cross-domain CORS blockages and path mismatch issues when deploying full-stack client-server bundles.
   - *Solution:* Standardized API calls through a centralized helper (`getApiUrl`) referencing `REACT_APP_API_URL` and configured Express CORS wildcard origin policies.

---

## 💡 Key Learnings

- **Full MERN Stack Integration:** Mastering asynchronous data flow between React frontends, Node/Express middleware, and MongoDB Atlas databases.
- **Authentication & Security:** Implementing dual auth strategies (JWT and Google OAuth 2.0) with bcrypt password salting and protected route guards.
- **Prompt Engineering & AI Integration:** Designing strict system prompts for Google Gemini to produce targeted, persona-driven debate responses and formatted JSON evaluation objects.
- **Database Schema Optimization:** Using Mongoose schemas, sparse indexing, and aggregation pipelines for analytics queries.
- **Responsive & Accessible UI Design:** Crafting dark-mode interfaces with Tailwind CSS and Framer Motion transitions.

---

## 🔮 Future Enhancements

- [ ] **Global Leaderboard:** Public rankings based on win rates, debate volume, and highest rhetorical scores.
- [ ] **Multiplayer Real-Time Debates:** WebSockets integration allowing human-vs-human debates judged by AI.
- [ ] **Exportable PDF Reports:** Comprehensive transcript and evaluation export options for academic portfolios.
- [ ] **Multi-Language Support:** Practice debating in Spanish, French, German, and Mandarin.
- [ ] **AI Debate Coach:** In-debate real-time hints suggesting strong counter-arguments and logical points.
- [ ] **Mobile Application:** Native iOS & Android application built using React Native.
- [ ] **Admin Dashboard:** Moderation portal to monitor system analytics, manage topics, and review feedback.

---

## 👨‍💻 Developer

<div align="center">

### **Peethambari Manavarti**
*Developer & Maintainer*

[![GitHub](https://img.shields.io/badge/GitHub-Peethambari123-181717?style=for-the-badge&logo=github)](https://github.com/Peethambari123)
[![Repository](https://img.shields.io/badge/Repository-AI--Debate--Arena2-blue?style=for-the-badge&logo=github)](https://github.com/Peethambari123/AI-Debate-Arena2)
[![Live App](https://img.shields.io/badge/Live_App-Render_Backend-000000?style=for-the-badge&logo=render)](https://ai-debate-backend-o9rt.onrender.com/)

</div>

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork the Repository** (`https://github.com/Peethambari123/AI-Debate-Arena2`)
2. **Create a Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit Your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

---

## 📄 License

This project is licensed under the **Educational Use License** — free for learning, personal practice, and demonstration purposes.

---

## 💬 Support

If you encounter any issues or have questions:
- Open a GitHub Issue at [AI-Debate-Arena2 / Issues](https://github.com/Peethambari123/AI-Debate-Arena2/issues)
- Star ⭐ the repository if you found this project helpful!

---

## 🙏 Acknowledgements

- [Google Gemini API](https://ai.google.dev/) for intelligent conversational models
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for cloud database infrastructure
- [React](https://react.dev/) & [Tailwind CSS](https://tailwindcss.com/) for UI components and styling
- [Render](https://render.com/) for web application hosting
- [Lucide React](https://lucide.dev/) for vector icons
- The Open Source Community for inspiring accessible AI tooling

---

<div align="center">
  <sub>Built with ❤️ by Peethambari Manavarti</sub>
</div>
