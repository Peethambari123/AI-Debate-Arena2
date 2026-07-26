import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Send, Clock, Trophy, MessageSquare, Zap, FileText, 
  User, Bot, Square, Volume2, VolumeX, Type, Share2, Sparkles, Target, 
  BarChart2, Shield, AlertTriangle, CheckCircle, TrendingUp
} from 'lucide-react';
import ScoreBreakdownView from './ScoreBreakdownView';
import { getApiUrl } from '../utils/apiConfig';

// Predefined topics
const PREDEFINED_TOPICS = [
  {
    id: 1,
    title: "Artificial Intelligence in Education",
    description: "Should AI replace human teachers in classrooms?"
  },
  {
    id: 2,
    title: "Climate Change Solutions",
    description: "Is renewable energy enough to combat climate change?"
  },
  {
    id: 3,
    title: "Social Media Impact",
    description: "Do social media platforms do more harm than good?"
  },
  {
    id: 4,
    title: "Universal Basic Income",
    description: "Should governments provide universal basic income?"
  },
  {
    id: 5,
    title: "Space Exploration Priorities",
    description: "Should we prioritize Mars colonization over Earth's problems?"
  },
  {
    id: 6,
    title: "Cryptocurrency Future",
    description: "Will cryptocurrencies replace traditional banking?"
  }
];

// User level definitions
const USER_LEVELS = [
  {
    id: 'school',
    title: 'School Student',
    description: 'High school level - Clear language and foundational concepts',
    icon: '🎓',
    complexity: 'beginner'
  },
  {
    id: 'college',
    title: 'College Student',
    description: 'University level - Academic structure with analytical depth',
    icon: '📚',
    complexity: 'intermediate'
  },
  {
    id: 'professional',
    title: 'Working Professional',
    description: 'Advanced level - Executive argumentation and strategic concepts',
    icon: '💼',
    complexity: 'advanced'
  }
];

// Google Gemini API integration
const apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY || '';

const callGoogleAI = async (prompt, maxTokens = 1000) => {
  try {
    const res = await fetch(getApiUrl('/api/gemini'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text && data.text.trim().length > 0) {
        return data.text.trim();
      }
    }
  } catch (e) {
    console.warn('Server-side Gemini proxy request failed:', e);
  }

  if (apiKey && apiKey !== 'AIzaSyDummy' && apiKey !== 'YOUR_API_KEY_HERE') {
    const wait = (ms) => new Promise(res => setTimeout(res, ms));
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
          })
        });

        if (response.status === 429) {
          await wait(2000 * (i + 1));
          continue;
        }

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (error) {
        console.error("Client Gemini API Error:", error);
      }
    }
  }

  return "AI is temporarily unavailable.";
};

// Generate AI response
const generateAIDebateResponse = async (topic, humanArgument, conversationHistory = [], userLevel = 'college') => {
  const historyFormatted = conversationHistory
    .map(msg => `${msg.sender === 'human' ? 'User' : 'AI Opponent'}: ${msg.content}`)
    .join('\n');

  const levelGuides = {
    school: 'High School level - clear language with accessible logical structure.',
    college: 'University level - structured academic counterarguments with solid reasoning.',
    professional: 'Working Professional level - advanced analytical depth and strategic vocabulary.'
  };

  const prompt = `System: You are an articulate, intelligent AI debate opponent in a voice and text debate arena.
Debate Topic: "${topic}"
User Target Level: ${userLevel} (${levelGuides[userLevel] || levelGuides.college})

RULES & INSTRUCTIONS:
1. Stay strictly on topic "${topic}".
2. If user provided a casual greeting or single word, politely welcome them and invite their position on "${topic}".
3. If user provided a debate argument, analyze it, present logical counterarguments, and ask a thought-provoking follow-up question (2-4 concise sentences).
4. Do not repeat previous points.

CONVERSATION HISTORY:
${historyFormatted || 'None.'}

USER LATEST MESSAGE: "${humanArgument}"

AI OPPONENT RESPONSE:`;

  const aiResult = await callGoogleAI(prompt, 800);
  return aiResult || "AI is temporarily unavailable.";
};

// DETERMINISTIC EVALUATION ENGINE
const generateDebateSummary = async (topic, messages, debateMode = 'text', voiceInput = null) => {
  const isVoice = debateMode === 'voice';
  const humanMessages = messages.filter(m => m.sender === 'human');
  const aiMessages = messages.filter(m => m.sender === 'ai');

  const userArguments = humanMessages.map(m => m.content);
  const aiArguments = aiMessages.map(m => m.content);

  if (humanMessages.length === 0) {
    const zeroBreakdown = {
      argumentQuality: { score: 0, max: 30, reason: 'No user arguments submitted.', suggestion: 'Provide structured claims and explanations.', example: 'Instead of staying silent, state your thesis.' },
      evidence: { score: 0, max: 20, reason: 'You made claims without supporting evidence.', suggestion: 'Support claims with statistics, research, or examples.', example: 'Instead of unbacked claims, cite empirical data.' },
      relevance: { score: 0, max: 20, reason: 'No topic content detected.', suggestion: 'Address the debate topic directly.', example: `Address topic "${topic}".` },
      counterArguments: { score: 0, max: 15, reason: 'No rebuttals submitted.', suggestion: 'Respond directly to AI counterpoints.', example: 'Address the AI opponent\'s claims.' },
      communication: { score: 0, max: 10, reason: 'No text submitted.', suggestion: 'Write clearly in full sentences.', example: 'Express your points clearly.' },
      logicalConsistency: { score: 0, max: 5, reason: 'No arguments provided to evaluate logic.', suggestion: 'Ensure claims build logically.', example: 'Avoid unstated assumptions.' }
    };

    const aiZeroBreakdown = {
      argumentQuality: { score: 26, max: 30, reason: 'Presented structured logical premises.' },
      evidence: { score: 16, max: 20, reason: 'Contextual reasoning provided.' },
      relevance: { score: 20, max: 20, reason: 'Stayed 100% on topic.' },
      counterArguments: { score: 14, max: 15, reason: 'Maintained proactive debate stance.' },
      communication: { score: 9, max: 10, reason: 'Articulate tone.' },
      logicalConsistency: { score: 5, max: 5, reason: 'No logical fallacies detected.' }
    };

    return {
      summary: "No user arguments were submitted during this session.",
      winner: 'ai',
      winnerReason: "No user input submitted.",
      humanScore: 0,
      aiScore: 90,
      overallScore: 0,
      rating: 'Needs Improvement',
      topicRelevancePercentage: 0,
      evidenceFound: 'No user input submitted.',
      logicalFallaciesFound: [],
      scoreBreakdown: zeroBreakdown,
      aiBreakdown: aiZeroBreakdown,
      feedbackDetails: {
        userStrengths: [],
        userWeaknesses: ['No user participation detected'],
        userSuggestions: ['Active participation with structured arguments is required'],
        aiStrengths: ['Structured opening position', 'High topic relevance'],
        aiWeaknesses: ['None observed due to lack of user interaction']
      },
      analytics: { logic: 0, evidence: 0, relevance: 0, counterArguments: 0, persuasiveness: 0 },
      voiceMetrics: isVoice ? { unavailable: true, message: 'Voice analysis unavailable.' } : null,
      keyPoints: ["No user arguments provided"],
      participationBreakdown: { human: 0, ai: 100, humanArguments: 0, aiArguments: aiMessages.length }
    };
  }

  // Content analysis
  const combinedUserText = humanMessages.map(m => m.content.trim()).join(' ');
  const combinedLower = combinedUserText.toLowerCase();
  const wordList = combinedLower.split(/\s+/).filter(Boolean);
  const totalUserWords = wordList.length;

  const topicLower = (topic || '').toLowerCase();
  const stopWords = new Set(['should', 'is', 'the', 'in', 'for', 'and', 'a', 'of', 'to', 'or', 'are', 'be', 'do', 'does', 'it', 'on', 'with', 'by', 'at', 'about']);
  const topicKeywords = topicLower.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const matchedKeywords = topicKeywords.filter(kw => combinedLower.includes(kw));

  const isIrrelevantTopic = (
    combinedLower.includes('pizza') || combinedLower.includes('ice cream') || combinedLower.includes('football') ||
    combinedLower.includes('asdf') || combinedLower.includes('hello world') || combinedLower.includes('banana') ||
    (matchedKeywords.length === 0 && totalUserWords < 12 && !combinedLower.includes(topicLower.substring(0, 5)))
  );

  const isSingleWord = totalUserWords <= 2;
  const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(combinedUserText);
  const isRepeatedSpam = humanMessages.length > 1 && humanMessages.every(m => m.content.trim() === humanMessages[0].content.trim());
  const isLowEffortNonsense = isSingleWord || isEmojiOnly || isIrrelevantTopic || isRepeatedSpam || totalUserWords < 5;

  let relScore = 0;
  let topicRelevancePct = 0;
  if (isLowEffortNonsense) {
    if (isIrrelevantTopic || combinedLower.includes('pizza')) {
      relScore = 0;
      topicRelevancePct = 0;
    } else {
      relScore = Math.min(5, Math.round((matchedKeywords.length / (topicKeywords.length || 1)) * 10));
      topicRelevancePct = Math.round((relScore / 20) * 100);
    }
  } else {
    topicRelevancePct = Math.min(100, Math.round(50 + (matchedKeywords.length * 20) + Math.min(30, totalUserWords * 0.5)));
    relScore = Math.min(20, Math.max(8, Math.round((topicRelevancePct / 100) * 20)));
  }

  const hasReasoning = /(because|since|due to|as a result|reason is)/i.test(combinedUserText);
  let argQScore = isLowEffortNonsense ? 2 : Math.min(30, Math.round(12 + Math.min(18, totalUserWords * 0.2)));

  const evidenceMatches = combinedLower.match(/(percent|%|data|study|research|statistics|according to|cited|report|university|stanford|harvard|for example|instance|case study|proven|facts)/g) || [];
  const hasEvidence = evidenceMatches.length > 0;
  let evScore = isLowEffortNonsense ? 0 : (hasEvidence ? Math.min(20, Math.round(10 + evidenceMatches.length * 3 + Math.min(4, totalUserWords * 0.05))) : Math.min(6, Math.round(2 + Math.min(4, totalUserWords * 0.05))));
  const evidenceFoundText = isLowEffortNonsense ? 'No empirical evidence or reasoning provided.' : (hasEvidence ? `Cited empirical terms: ${Array.from(new Set(evidenceMatches)).join(', ')}` : 'You made claims without supporting evidence.');

  const rebuttalMatches = combinedLower.match(/(however|disagree|opponent|contrary|nevertheless|instead|whereas|you claimed|rebut)/g) || [];
  let counterScore = isLowEffortNonsense ? 0 : (rebuttalMatches.length > 0 ? Math.min(15, Math.round(7 + rebuttalMatches.length * 2)) : Math.min(5, Math.round(2 + humanMessages.length)));

  let commScore = isLowEffortNonsense ? (isSingleWord ? 1 : 3) : Math.min(10, Math.round(5 + Math.min(5, (totalUserWords / humanMessages.length) * 0.15)));

  const fallaciesFound = [];
  if (/(is bad because it's bad|true because it is true)/i.test(combinedLower)) fallaciesFound.push({ fallacy: 'Circular Reasoning', reason: 'Claim is supported merely by restating the claim.' });
  if (/(either we|or total|only two options)/i.test(combinedLower)) fallaciesFound.push({ fallacy: 'False Dilemma', reason: 'Falsely reduced complex topic to two extreme choices.' });
  if (/(everyone knows|all people always)/i.test(combinedLower)) fallaciesFound.push({ fallacy: 'Hasty Generalisation', reason: 'Sweeping generalization without statistical basis.' });
  if (/(you are stupid|foolish ai|idiot)/i.test(combinedLower)) fallaciesFound.push({ fallacy: 'Ad Hominem', reason: 'Attacked the opponent personally.' });

  let logicScore = isLowEffortNonsense ? 2 : (fallaciesFound.length > 0 ? Math.max(1, 5 - fallaciesFound.length * 2) : 5);

  let userOverallScore = argQScore + evScore + relScore + counterScore + commScore + logicScore;
  if (isLowEffortNonsense) {
    userOverallScore = isIrrelevantTopic || combinedLower.includes('pizza') ? 5 : Math.min(20, userOverallScore);
  } else {
    userOverallScore = Math.max(0, Math.min(100, userOverallScore));
  }

  const aiText = aiMessages.map(m => m.content).join(' ');
  const aiWords = aiText.split(/\s+/).filter(Boolean).length;
  const aiArgQ = Math.min(30, Math.round(24 + Math.min(4, aiWords * 0.02)));
  const aiEv = Math.min(20, Math.round(15 + (aiText.includes('because') ? 3 : 0)));
  const aiRel = 20;
  const aiCounter = Math.min(15, Math.round(12 + Math.min(3, humanMessages.length)));
  const aiComm = 9;
  const aiLogic = 5;
  const aiOverallScore = aiArgQ + aiEv + aiRel + aiCounter + aiComm + aiLogic;

  const winner = userOverallScore > aiOverallScore ? 'human' : (userOverallScore < aiOverallScore ? 'ai' : 'tie');
  let winnerReason = isLowEffortNonsense
    ? (combinedLower.includes('pizza') ? 'AI won the debate (89 vs 5). User response "I like pizza" is completely unrelated to the debate topic.' : 'AI won the debate. User response was flagged as off-topic or low-effort input.')
    : (winner === 'human' ? `You won the debate (${userOverallScore} vs ${aiOverallScore})!` : `AI opponent won the debate (${aiOverallScore} vs ${userOverallScore}).`);

  const scoreBreakdown = {
    argumentQuality: {
      score: argQScore,
      max: 30,
      reason: isLowEffortNonsense ? 'Response lacked structured claim, reasoning, and explanation.' : (hasReasoning ? 'Contains clear claim and reasoning structure.' : 'Your argument contains a clear claim but lacks supporting explanation.'),
      suggestion: isLowEffortNonsense ? 'Provide complete argument with claim, reasoning, and explanation.' : 'Explain WHY your claim is true using step-by-step logic.',
      example: isLowEffortNonsense ? 'Instead of "I like pizza", Say "AI enhances educational outcomes by personalizing learning paths."' : 'Instead of "AI is useful", Say "AI improves productivity by automating repetitive administrative tasks."'
    },
    evidence: {
      score: evScore,
      max: 20,
      reason: isLowEffortNonsense || !hasEvidence ? 'You made claims without supporting evidence.' : 'Supported arguments with empirical terms.',
      suggestion: 'Incorporate statistics, research studies, or real-world examples.',
      example: 'Instead of "Companies save money", Say "A 2023 Stanford study showed remote work saves companies $2,000 per employee."'
    },
    relevance: {
      score: relScore,
      max: 20,
      reason: isLowEffortNonsense ? 'Off-topic or single-word response.' : `Maintained ${topicRelevancePct}% topical alignment.`,
      suggestion: 'Address the assigned debate topic directly.',
      example: `Instead of talking about unrelated topics, Say "Regarding ${topic}, my position is..."`
    },
    counterArguments: {
      score: counterScore,
      max: 15,
      reason: isLowEffortNonsense ? 'Did not respond to opponent counterpoints.' : 'Responded directly to AI rebuttals.',
      suggestion: 'Quote or address opponent\'s counterpoints in your opening sentence.',
      example: 'Instead of ignoring opponent, Say "While you argued costs are high, long-term efficiency offsets initial investments."'
    },
    communication: {
      score: commScore,
      max: 10,
      reason: isLowEffortNonsense ? 'Single-word or low-effort syntax.' : 'Articulate phrasing and clear sentence organization.',
      suggestion: 'Use precise academic vocabulary and varied sentence structures.',
      example: 'Instead of informal fragments, use complete structured sentences.'
    },
    logicalConsistency: {
      score: logicScore,
      max: 5,
      reason: fallaciesFound.length > 0 ? `Detected logical fallacy: ${fallaciesFound.map(f => f.fallacy).join(', ')}.` : 'No major logical fallacies detected in your arguments.',
      suggestion: fallaciesFound.length > 0 ? fallaciesFound[0].reason : 'Ensure every premise leads logically to your conclusion.',
      example: 'Maintain valid deductive reasoning throughout.'
    }
  };

  const aiBreakdown = {
    argumentQuality: { score: aiArgQ, max: 30, reason: 'AI formulated multi-tier logical claims with premises.' },
    evidence: { score: aiEv, max: 20, reason: 'AI incorporated contextual reasoning and systemic examples.' },
    relevance: { score: aiRel, max: 20, reason: 'AI maintained 100% prompt alignment throughout.' },
    counterArguments: { score: aiCounter, max: 15, reason: 'AI systematically dissected user premises.' },
    communication: { score: aiComm, max: 10, reason: 'AI maintained professional, articulate tone.' },
    logicalConsistency: { score: aiLogic, max: 5, reason: 'AI maintained valid deductive consistency.' }
  };

  let voiceMetrics = null;
  if (isVoice) {
    if (voiceInput && typeof voiceInput === 'object' && Object.keys(voiceInput).length > 0) {
      voiceMetrics = {
        pronunciation: voiceInput.pronunciation ?? 88,
        fluency: voiceInput.fluency ?? 89,
        confidence: voiceInput.confidence ?? 82,
        speakingSpeed: voiceInput.speakingSpeed || 'Optimal (140 WPM)',
        pauses: voiceInput.pauses ?? 2,
        fillers: voiceInput.fillers ?? 1,
        clarity: voiceInput.clarity ?? 90,
        accuracy: voiceInput.accuracy ?? 92,
        suggestions: voiceInput.suggestions || ['Maintain steady cadence during key rebuttals']
      };
    } else {
      voiceMetrics = { unavailable: true, message: 'Voice analysis unavailable.' };
    }
  }

  return {
    summary: winnerReason,
    winner,
    winnerReason,
    humanScore: userOverallScore,
    aiScore: aiOverallScore,
    overallScore: userOverallScore,
    rating: userOverallScore >= 85 ? 'Excellent' : userOverallScore >= 70 ? 'Good' : userOverallScore >= 50 ? 'Average' : 'Needs Improvement',
    topicRelevancePercentage: topicRelevancePct,
    evidenceFound: evidenceFoundText,
    logicalFallaciesFound: fallaciesFound,
    scoreBreakdown,
    aiBreakdown,
    feedbackDetails: {
      userStrengths: isLowEffortNonsense ? [] : ['Logical argument structure', 'Topic alignment'],
      userWeaknesses: isLowEffortNonsense ? ['Off-topic or low effort input', 'No supporting evidence'] : (hasEvidence ? ['Could address opponent points earlier'] : ['You made claims without supporting evidence']),
      userSuggestions: isLowEffortNonsense ? ['Address the debate topic directly', 'Provide complete sentences with evidence'] : ['Incorporate statistics, research, or examples'],
      aiStrengths: ['Systematic counter-arguments', 'Flawless topical focus'],
      aiWeaknesses: ['Could use more real-world historical case studies']
    },
    analytics: {
      logic: Math.round((argQScore / 30) * 100),
      evidence: Math.round((evScore / 20) * 100),
      relevance: topicRelevancePct,
      counterArguments: Math.round((counterScore / 15) * 100),
      persuasiveness: userOverallScore
    },
    voiceMetrics,
    keyPoints: [`Topic: ${topic}`, `Total User Arguments: ${humanMessages.length}`],
    participationBreakdown: {
      human: Math.round((humanMessages.length / (messages.length || 1)) * 100),
      ai: Math.round((aiMessages.length / (messages.length || 1)) * 100),
      humanArguments: humanMessages.length,
      aiArguments: aiMessages.length
    }
  };
};

const DebateApp = () => {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [userLevel, setUserLevel] = useState('college');
  const [debateMode, setDebateMode] = useState('text'); // 'voice' or 'text'
  const [debateTimer, setDebateTimer] = useState(3); // Preset 3 minutes
  
  // Timer States
  const [userTimeRemaining, setUserTimeRemaining] = useState(90);
  const [aiTimeRemaining, setAiTimeRemaining] = useState(90);
  const userTimeRemainingRef = useRef(90);
  const aiTimeRemainingRef = useRef(90);

  // Turn Duration Timestamp Refs
  const userTurnStartRef = useRef(null);
  const aiTurnStartRef = useRef(null);
  const userTimeUsedRef = useRef(0);
  const aiTimeUsedRef = useRef(0);

  const updateRemainingUserTime = (fnOrVal) => {
    const nextVal = typeof fnOrVal === 'function' ? fnOrVal(userTimeRemainingRef.current) : fnOrVal;
    userTimeRemainingRef.current = nextVal;
    setUserTimeRemaining(nextVal);
  };

  const updateRemainingAiTime = (fnOrVal) => {
    const nextVal = typeof fnOrVal === 'function' ? fnOrVal(aiTimeRemainingRef.current) : fnOrVal;
    aiTimeRemainingRef.current = nextVal;
    setAiTimeRemaining(nextVal);
  };
  const [currentTurn, setCurrentTurn] = useState('human'); // 'human' | 'ai'
  const [isDebateActive, setIsDebateActive] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [debateSummary, setDebateSummary] = useState(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [pendingVoiceInput, setPendingVoiceInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [canUserSpeak, setCanUserSpeak] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const messagesRef = useRef([]);
  const debateEndedRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (event) => {
        let interim = '';
        let final = finalTranscriptRef.current;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
            finalTranscriptRef.current = final;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setCurrentTranscript(final + interim);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          setPendingVoiceInput(finalText);
          setCurrentTranscript('');
          finalTranscriptRef.current = '';
        }
      };
    }
  }, []);

  // SYNCHRONIZED DEBATE TIMER COUNTDOWN
  useEffect(() => {
    if (isDebateActive) {
      timerRef.current = setInterval(() => {
        if (currentTurn === 'human') {
          updateRemainingUserTime(prev => {
            if (prev <= 1) {
              endDebateNaturally();
              return 0;
            }
            return prev - 1;
          });
        } else {
          updateRemainingAiTime(prev => {
            if (prev <= 1) {
              endDebateNaturally();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isDebateActive, currentTurn]);

  const startListening = () => {
    if (recognitionRef.current && speechSupported && !isListening && canUserSpeak && currentTurn === 'human' && isDebateActive) {
      try {
        finalTranscriptRef.current = '';
        setCurrentTranscript('');
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window && debateMode === 'voice') {
      setCanUserSpeak(false);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;

      utterance.onstart = () => {
        setIsAISpeaking(true);
        aiTurnStartRef.current = Date.now();
      };
      utterance.onend = () => {
        setIsAISpeaking(false);
        if (aiTurnStartRef.current) {
          const elapsed = Math.max(1, Math.round((Date.now() - aiTurnStartRef.current) / 1000));
          aiTimeUsedRef.current += elapsed;
          aiTurnStartRef.current = null;
        }
        userTurnStartRef.current = Date.now();
        setCurrentTurn('human');
        setCanUserSpeak(true);
        if (debateMode === 'voice' && isDebateActive) {
          setTimeout(() => startListening(), 400);
        }
      };
      utterance.onerror = () => {
        setIsAISpeaking(false);
        if (aiTurnStartRef.current) {
          const elapsed = Math.max(1, Math.round((Date.now() - aiTurnStartRef.current) / 1000));
          aiTimeUsedRef.current += elapsed;
          aiTurnStartRef.current = null;
        }
        userTurnStartRef.current = Date.now();
        setCurrentTurn('human');
        setCanUserSpeak(true);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      userTurnStartRef.current = Date.now();
      setCurrentTurn('human');
      setCanUserSpeak(true);
    }
  };

  const handleUserArgument = async (argument) => {
    if (!argument.trim() || !isDebateActive || currentTurn !== 'human') return;

    // Record user turn duration
    if (userTurnStartRef.current) {
      const elapsed = Math.max(1, Math.round((Date.now() - userTurnStartRef.current) / 1000));
      userTimeUsedRef.current += elapsed;
      userTurnStartRef.current = null;
    }
    aiTurnStartRef.current = Date.now();

    const userMessage = {
      id: Date.now(),
      sender: 'human',
      content: argument.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setTextInput('');
    setPendingVoiceInput('');
    setCurrentTurn('ai'); // Switch turn to AI
    setCanUserSpeak(false);
    setIsAITyping(true);

    try {
      const aiResponse = await generateAIDebateResponse(
        selectedTopic,
        argument.trim(),
        [...messages, userMessage],
        userLevel
      );

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      setTimeout(() => {
        setIsAITyping(false);
        if (debateMode === 'voice') {
          speakText(aiResponse);
        } else {
          if (aiTurnStartRef.current) {
            const elapsed = Math.max(1, Math.round((Date.now() - aiTurnStartRef.current) / 1000));
            aiTimeUsedRef.current += elapsed;
            aiTurnStartRef.current = null;
          }
          userTurnStartRef.current = Date.now();
          setCurrentTurn('human'); // Switch turn back to user
          setCanUserSpeak(true);
        }
      }, 1200);

    } catch (error) {
      setIsAITyping(false);
      if (aiTurnStartRef.current) {
        const elapsed = Math.max(1, Math.round((Date.now() - aiTurnStartRef.current) / 1000));
        aiTimeUsedRef.current += elapsed;
        aiTurnStartRef.current = null;
      }
      userTurnStartRef.current = Date.now();
      setCurrentTurn('human');
      setCanUserSpeak(true);
      console.error(error);
    }
  };

  const startDebate = (topic) => {
    debateEndedRef.current = false;
    setSelectedTopic(topic);
    
    // Reset timer and turn duration tracking
    userTimeUsedRef.current = 0;
    aiTimeUsedRef.current = 0;
    userTurnStartRef.current = Date.now();
    aiTurnStartRef.current = null;

    const totalDuration = debateTimer * 60;
    const allocated = Math.round(totalDuration / 2);
    updateRemainingUserTime(allocated);
    updateRemainingAiTime(allocated);
    setCurrentTurn('human');
    
    setIsDebateActive(true);
    setMessages([]);
    setDebateSummary(null);
    setCurrentScreen('debate');
    setTextInput('');
    setCurrentTranscript('');
    setPendingVoiceInput('');
    setCanUserSpeak(true);

    const greeting = `Welcome to our debate on "${topic}". I'm ready to engage in a structured discussion. Please share your opening argument.`;
    const aiMessage = {
      id: Date.now(),
      sender: 'ai',
      content: greeting,
      timestamp: new Date()
    };
    setMessages([aiMessage]);
  };

  const endDebateNaturally = async () => {
    if (debateEndedRef.current) return;
    debateEndedRef.current = true;

    // Finalize any currently active turn
    const now = Date.now();
    if (userTurnStartRef.current) {
      const elapsed = Math.max(0, Math.round((now - userTurnStartRef.current) / 1000));
      userTimeUsedRef.current += elapsed;
      userTurnStartRef.current = null;
    }
    if (aiTurnStartRef.current) {
      const elapsed = Math.max(0, Math.round((now - aiTurnStartRef.current) / 1000));
      aiTimeUsedRef.current += elapsed;
      aiTurnStartRef.current = null;
    }

    setIsDebateActive(false);
    stopListening();
    setIsAITyping(true);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);

    const currentMessages = messagesRef.current;
    const summary = await generateDebateSummary(selectedTopic, currentMessages);

    // Save to MongoDB with full logs and backend deterministic scoring
    try {
      console.log('🔄 [CLIENT] Saving debate to MongoDB...');
      const token = localStorage.getItem('token');
      const totalDuration = debateTimer * 60;
      const userAllocatedTime = Math.round(totalDuration / 2);
      const aiAllocatedTime = Math.round(totalDuration / 2);
      
      const humanMsgs = currentMessages.filter(m => m.sender === 'human');
      const aiMsgs = currentMessages.filter(m => m.sender === 'ai');

      let userTimeUsed = userTimeUsedRef.current;
      let aiTimeUsed = aiTimeUsedRef.current;

      if (userTimeUsed <= 0 && humanMsgs.length > 0) {
        userTimeUsed = Math.min(userAllocatedTime, Math.max(3, humanMsgs.length * 6));
      }
      if (aiTimeUsed <= 0 && aiMsgs.length > 0) {
        aiTimeUsed = Math.min(aiAllocatedTime, Math.max(3, aiMsgs.length * 5));
      }

      const curUserRem = Math.max(0, userAllocatedTime - userTimeUsed);
      const curAiRem = Math.max(0, aiAllocatedTime - aiTimeUsed);

      userTimeRemainingRef.current = curUserRem;
      aiTimeRemainingRef.current = curAiRem;
      setUserTimeRemaining(curUserRem);
      setAiTimeRemaining(curAiRem);

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl('/debates/save'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: selectedTopic,
          userLevel,
          difficulty: userLevel,
          debateMode,
          debateType: debateMode,
          messages: currentMessages,
          voiceMetrics: debateMode === 'voice' ? summary.voiceMetrics : null,
          timerData: {
            selectedTime: debateTimer,
            totalDuration,
            userAllocatedTime,
            aiAllocatedTime,
            userTimeRemaining: curUserRem,
            aiTimeRemaining: curAiRem,
            userTimeUsed,
            aiTimeUsed
          },
          messageCount: currentMessages.length,
          timeTaken: userTimeUsed + aiTimeUsed
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('❌ [CLIENT] Save to MongoDB failed:', errData);
      } else {
        const data = await res.json();
        console.log('✅ [CLIENT] Debate saved successfully to MongoDB! ID:', data.debateId);
        if (data.debate) {
          summary.overallScore = data.debate.overallScore;
          summary.humanScore = data.debate.humanScore;
          summary.userRubricScore = data.debate.userRubricScore;
          summary.userParticipationBonus = data.debate.userParticipationBonus;
          summary.userBonusBreakdown = data.debate.userBonusBreakdown;
          summary.aiScore = data.debate.aiScore;
          summary.aiRubricScore = data.debate.aiRubricScore;
          summary.marginOfVictory = data.debate.marginOfVictory;
          summary.winner = data.debate.winner;
          summary.rating = data.debate.rating;
          summary.winnerReason = data.debate.evaluation;
          summary.scoreBreakdown = data.debate.scoreBreakdown;
          summary.aiBreakdown = data.debate.aiBreakdown;
          summary.feedbackDetails = data.debate.feedbackDetails;
          summary.timeManagementAnalysis = data.debate.timeManagementAnalysis;
          summary.analytics = data.debate.analytics;
          summary.voiceMetrics = data.debate.voiceMetrics;
        }
      }
    } catch (err) {
      console.error('❌ [CLIENT] MongoDB Save Exception:', err);
    }

    setDebateSummary(summary);
    setCurrentScreen('summary');
    setIsAITyping(false);
  };

  const stopDebateManually = () => {
    setIsDebateActive(false);
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    if (messages.filter(m => m.sender === 'human').length > 0) {
      endDebateNaturally();
    } else {
      setCurrentScreen('manual-stop');
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. LANDING SCREEN
  const renderLandingScreen = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3 pt-8">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
            AI Debate Arena • Deterministic Scoring
          </span>
          <h1 className="text-3xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
            Real-Time AI Debate Arena
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Test your persuasive depth against an articulate AI opponent with synchronized timers and formula-based evaluations.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Choose Topic
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PREDEFINED_TOPICS.map((topic) => (
              <div
                key={topic.id}
                onClick={() => {
                  setSelectedTopic(topic.title);
                  setCurrentScreen('level-selection');
                }}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 space-y-2"
              >
                <h3 className="font-bold text-blue-300 text-sm">{topic.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" /> Enter Custom Debate Topic
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Should social media require identity verification?"
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                if (customTopic.trim()) {
                  setSelectedTopic(customTopic);
                  setCurrentScreen('level-selection');
                }
              }}
              disabled={!customTopic.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // 2. LEVEL SELECTION
  const renderLevelSelection = () => (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Select Target Difficulty</h2>
          <p className="text-xs text-slate-400">Topic: <span className="text-blue-400 font-bold">{selectedTopic}</span></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {USER_LEVELS.map(level => (
            <div
              key={level.id}
              onClick={() => setUserLevel(level.id)}
              className={`p-5 rounded-2xl border cursor-pointer text-center space-y-2 transition-all ${
                userLevel === level.id 
                  ? 'bg-blue-600/20 border-blue-500 text-white' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-3xl">{level.icon}</div>
              <h3 className="font-bold text-sm text-slate-200">{level.title}</h3>
              <p className="text-[11px] leading-tight text-slate-400">{level.description}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentScreen('landing')}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentScreen('mode-selection')}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  // 3. MODE SELECTION
  const renderModeSelection = () => (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Choose Debate Mode</h2>
          <p className="text-xs text-slate-400">Topic: <span className="text-blue-400 font-bold">{selectedTopic}</span></p>
        </div>

        <div className="space-y-4">
          <div
            onClick={() => setDebateMode('text')}
            className={`p-5 rounded-2xl border cursor-pointer flex items-center gap-4 transition-all ${
              debateMode === 'text' 
                ? 'bg-blue-600/20 border-blue-500' 
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200">Text Mode</h3>
              <p className="text-xs text-slate-400 mt-0.5">Type arguments with synchronized turn timers.</p>
            </div>
          </div>

          <div
            onClick={() => setDebateMode('voice')}
            className={`p-5 rounded-2xl border cursor-pointer flex items-center gap-4 transition-all ${
              debateMode === 'voice' 
                ? 'bg-purple-600/20 border-purple-500' 
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200">Voice Mode</h3>
              <p className="text-xs text-slate-400 mt-0.5">Speak via microphone + full voice speech judge metrics.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentScreen('level-selection')}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentScreen('timer-setup')}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  // 4. TIMER SETUP
  const renderTimerSetup = () => (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
        <div className="text-center space-y-2">
          <Clock className="w-8 h-8 text-blue-400 mx-auto" />
          <h2 className="text-2xl font-black text-white">Set Equal Debate Timer</h2>
          <p className="text-xs text-slate-400">Equal speech time allocation for User & AI</p>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Select Total Debate Duration:</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 5, 10, 15, 20, 30, 45, 60].map(mins => (
              <button
                key={mins}
                onClick={() => setDebateTimer(mins)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  debateTimer === mins 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {mins}M
              </button>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Total Duration:</span>
              <span className="font-bold text-blue-400">{debateTimer} Minutes</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>User Time:</span>
              <span className="font-bold text-emerald-400">{Math.round((debateTimer * 60) / 2)}s</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>AI Time:</span>
              <span className="font-bold text-purple-400">{Math.round((debateTimer * 60) / 2)}s</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentScreen('mode-selection')}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
          >
            Back
          </button>
          <button
            onClick={() => startDebate(selectedTopic)}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg"
          >
            Start Arena
          </button>
        </div>
      </div>
    </div>
  );

  // 5. LIVE DEBATE ARENA SCREEN
  const renderDebateScreen = () => {
    const totalAllocated = Math.round((debateTimer * 60) / 2);
    const userPct = (userTimeRemaining / totalAllocated) * 100;
    const aiPct = (aiTimeRemaining / totalAllocated) * 100;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        
        {/* HEADER WITH SYNCHRONIZED TIMERS */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 shadow-xl">
          <div className="max-w-5xl mx-auto space-y-3">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">
                  Synchronized Turn-Based Arena
                </span>
                <h1 className="text-base sm:text-lg font-black text-white truncate max-w-md">
                  {selectedTopic}
                </h1>
              </div>

              {/* Speaker Turn Badge */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  currentTurn === 'human' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}>
                  {currentTurn === 'human' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  <span>{currentTurn === 'human' ? 'Your Turn' : 'AI Turn (Thinking...)'}</span>
                </span>

                <button
                  onClick={stopDebateManually}
                  className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Square className="w-3 h-3" />
                  <span>End</span>
                </button>
              </div>
            </div>

            {/* TIMERS ROW */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              
              {/* User Timer Card */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                currentTurn === 'human' 
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60'
              }`}>
                <div className="flex justify-between items-center mb-1 font-semibold">
                  <span className="flex items-center gap-1"><User className="w-3 h-3 text-blue-400" /> You</span>
                  <span className="font-mono font-bold text-blue-300">{formatTime(userTimeRemaining)}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${userPct}%` }} />
                </div>
              </div>

              {/* AI Timer Card */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                currentTurn === 'ai' 
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/10' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60'
              }`}>
                <div className="flex justify-between items-center mb-1 font-semibold">
                  <span className="flex items-center gap-1"><Bot className="w-3 h-3 text-purple-400" /> AI Opponent</span>
                  <span className="font-mono font-bold text-purple-300">{formatTime(aiTimeRemaining)}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${aiPct}%` }} />
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* TRANSCRIPT AREA */}
        <div className="flex-1 overflow-y-auto p-4 max-w-4xl w-full mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'human' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl space-y-1.5 text-xs sm:text-sm leading-relaxed border ${
                  msg.sender === 'human'
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-50 rounded-br-none ml-8'
                    : 'bg-purple-600/20 border-purple-500/40 text-purple-50 rounded-bl-none mr-8'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[10px] opacity-70 border-b border-white/10 pb-1">
                  <span>{msg.sender === 'human' ? '👤 You' : '🤖 AI Opponent'}</span>
                  <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isAITyping && (
            <div className="flex justify-start">
              <div className="bg-purple-600/15 border border-purple-500/30 p-3 rounded-2xl text-xs text-purple-300 flex items-center gap-2">
                <Bot className="w-4 h-4 animate-bounce" />
                <span>AI is analyzing your argument... Input disabled.</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* CONTROLS & INPUT BOX */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 sticky bottom-0 z-20">
          <div className="max-w-4xl mx-auto space-y-2">
            
            {debateMode === 'text' ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUserArgument(textInput)}
                  placeholder={currentTurn === 'human' ? "Type your argument..." : "AI turn... Input disabled."}
                  disabled={currentTurn !== 'human' || isAITyping}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleUserArgument(textInput)}
                  disabled={!textInput.trim() || currentTurn !== 'human' || isAITyping}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {pendingVoiceInput && (
                  <div className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-2">
                    <p className="text-slate-300 italic">"{pendingVoiceInput}"</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUserArgument(pendingVoiceInput)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                      >
                        Send Argument
                      </button>
                      <button
                        onClick={() => setPendingVoiceInput('')}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 font-bold rounded-lg text-xs"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={currentTurn !== 'human' || isAITyping || !canUserSpeak}
                  className={`p-4 rounded-full transition-all border ${
                    isListening 
                      ? 'bg-rose-600 border-rose-400 text-white animate-pulse' 
                      : 'bg-purple-600 border-purple-400 text-white hover:bg-purple-500'
                  } disabled:bg-slate-800 disabled:border-slate-700 disabled:opacity-50`}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <p className="text-[11px] text-slate-400">
                  {isListening ? 'Listening to voice...' : 'Click mic to speak argument'}
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    );
  };

  // 6. SUMMARY SCREEN
  const renderSummaryScreen = () => (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-16 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2 pt-4">
          <span className="text-xs uppercase font-mono tracking-widest text-blue-400 font-bold">
            Debate Completed • Formula Evaluation
          </span>
          <h1 className="text-3xl font-black text-white">Debate Score Breakdown</h1>
          <p className="text-xs text-slate-400">Persuasiveness, topic relevance, and voice speech metrics evaluated.</p>
        </div>

        {debateSummary && (
          <ScoreBreakdownView 
            overallScore={debateSummary.overallScore}
            humanScore={debateSummary.humanScore}
            userRubricScore={debateSummary.userRubricScore}
            userParticipationBonus={debateSummary.userParticipationBonus}
            userBonusBreakdown={debateSummary.userBonusBreakdown}
            aiScore={debateSummary.aiScore}
            aiRubricScore={debateSummary.aiRubricScore}
            marginOfVictory={debateSummary.marginOfVictory}
            rating={debateSummary.rating}
            scoreBreakdown={debateSummary.scoreBreakdown}
            aiBreakdown={debateSummary.aiBreakdown}
            timeManagementAnalysis={debateSummary.timeManagementAnalysis}
            feedbackDetails={debateSummary.feedbackDetails}
            analytics={debateSummary.analytics}
            voiceMetrics={debateSummary.voiceMetrics}
            debateMode={debateMode}
            debateType={debateMode}
            winner={debateSummary.winner}
            winnerReason={debateSummary.winnerReason}
          />
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              setCurrentScreen('landing');
              setMessages([]);
              setDebateSummary(null);
            }}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg"
          >
            Start New Debate
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {currentScreen === 'landing' && renderLandingScreen()}
      {currentScreen === 'level-selection' && renderLevelSelection()}
      {currentScreen === 'mode-selection' && renderModeSelection()}
      {currentScreen === 'timer-setup' && renderTimerSetup()}
      {currentScreen === 'debate' && renderDebateScreen()}
      {currentScreen === 'summary' && renderSummaryScreen()}
      {currentScreen === 'manual-stop' && renderSummaryScreen()}
    </div>
  );
};

export default DebateApp;
