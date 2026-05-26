import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, ChevronRight, Brain, Clock,
  BarChart2, MessageCircle, CheckCircle, AlertCircle,
  Loader2, Volume2, VolumeX, Keyboard, Settings, LogOut, Video, Headphones, Square
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';

// Helper to format remaining time
const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function LiveInterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  // Real REST context hooks from InterviewContext
  const { getNextQuestion, evaluateAnswer, completeSession } = useInterview();

  // Core state variables: default to 'lobby' to bypass browser user-activation restrictions for audio synthesis!
  const [phase, setPhase] = useState('lobby'); // lobby | loading | question | answering | evaluating | complete
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showEval, setShowEval] = useState(false);
  const [transcript, setTranscript] = useState([]); // [{role, text, eval}]
  
  // Custom interactive settings
  const [isMuted, setIsMuted] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(1.0); // 0.8 | 1.0 | 1.2
  const [voiceActivation, setVoiceActivation] = useState(true); // Hands-free Auto-microphone
  const [showTextDrawer, setShowTextDrawer] = useState(false); // Typing fallback mode
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // Lobby audio-test animation waves
  const [micActiveTest, setMicActiveTest] = useState(false);

  // Timers
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalSeconds] = useState(30 * 60); // 30 mins

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const timeoutRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const handleSubmitAnswerRef = useRef(null);
  
  // Persistent utterance reference to prevent Chrome V8 garbage-collection bugs!
  const utteranceRef = useRef(null);
  
  const MAX_QUESTIONS = 5;

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        
        // Filter English voices with stable fallbacks
        const englishVoice = available.find(
          v => v.lang.startsWith('en') && 
          v.localService === true &&
          (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
        ) || available.find(
          v => v.lang.startsWith('en') && v.localService === true
        ) || available.find(
          v => v.lang.startsWith('en')
        );
        
        setSelectedVoice(englishVoice || null);
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Periodic resume interval to prevent Chrome's 15-second Speech Synthesis mute freeze bug!
  useEffect(() => {
    let resumeInterval = null;
    if (isSpeaking) {
      resumeInterval = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.resume();
          } catch (e) {
            // Ignore
          }
        }
      }, 4000); // Resume every 4 seconds when speaking is active
    }
    return () => {
      if (resumeInterval) clearInterval(resumeInterval);
    };
  }, [isSpeaking]);

  // Timer runner
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => {
        if (s >= totalSeconds - 1) {
          clearInterval(timerRef.current);
          handleFinish();
        }
        return s + 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          console.error("Failed to cancel speech synthesis on unmount:", e);
        }
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Failed to abort speech recognition on unmount:", e);
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Auto scroll transcript drawer
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Request mic permission for lobby test
  const handleTestMic = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicActiveTest(true);
    } catch (err) {
      console.warn("Microphone access denied:", err);
      alert("Please allow microphone permissions to perform voice interviews.");
    }
  };

  // Unlocks browser audio restrictions and enters the active interview call
  const handleJoinCall = async () => {
    // 1. Force microphone permission check before entering the active interview
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("Microphone access denied:", err);
      alert("Microphone access is required for the AI interviewer to hear your voice commands. Please allow mic access in your browser settings.");
      return;
    }

    // 2. Play a warm verbal chime to unlock the browser's User Activation Gate
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const welcomeUtterance = new SpeechSynthesisUtterance("Joining interview call. Connection established.");
        utteranceRef.current = welcomeUtterance;
        
        if (selectedVoice) {
          welcomeUtterance.voice = selectedVoice;
        }
        welcomeUtterance.rate = ttsSpeed;
        window.speechSynthesis.speak(welcomeUtterance);
      } catch (err) {
        console.error("Error speaking welcome utterance:", err);
      }
    }
    
    // 3. Transition state and trigger timer
    setPhase('loading');
    startTimer();
    loadNextQuestion();
  };

  // Start Speech Recognition
  const startVoiceRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    // Stop synthesis if speaking
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.error("Failed to cancel speech synthesis:", err);
      }
      setIsSpeaking(false);
    }

    // Clean up any existing recognition instance to prevent concurrent active recognition instances!
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.error("Failed to abort existing speech recognition:", err);
      }
      recognitionRef.current = null;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event) => {
        try {
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          
          // Clean up the text for command checking
          const cleanText = fullTranscript.trim().toLowerCase();
          
          // Check for voice commands: "submit answer", "submit response", "submit", or "done"
          if (cleanText.endsWith("submit answer") || cleanText.endsWith("submit response") || cleanText.endsWith("submit") || cleanText.endsWith("done")) {
            // Extract the answer by stripping the command word/phrase
            let commandPhrase = "";
            if (cleanText.endsWith("submit answer")) commandPhrase = "submit answer";
            else if (cleanText.endsWith("submit response")) commandPhrase = "submit response";
            else if (cleanText.endsWith("submit")) commandPhrase = "submit";
            else if (cleanText.endsWith("done")) commandPhrase = "done";
            
            // Remove the command suffix from the transcript to prevent it from being submitted as part of the answer!
            const finalAnswer = fullTranscript.substring(0, fullTranscript.toLowerCase().lastIndexOf(commandPhrase)).trim();
            
            if (finalAnswer) {
              setAnswerText(finalAnswer);
              if (handleSubmitAnswerRef.current) {
                handleSubmitAnswerRef.current(finalAnswer);
              }
              return;
            }
          }
          
          setAnswerText(fullTranscript);
        } catch (err) {
          console.error("Error processing speech recognition result:", err);
        }
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      recognitionRef.current = rec;
      setIsRecording(true);
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsRecording(false);
    }
  }, []);

  // Stop Speech Recognition
  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Speech recognition stop error:", err);
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Dynamic Text-to-Speech Engine
  const speakQuestion = useCallback((text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (voiceActivation) {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = setTimeout(() => startVoiceRecognition(), 800);
      }
      return;
    }
    
    try {
      // Stop any ongoing speaking before starting
      window.speechSynthesis.cancel();
    } catch (err) {
      console.error("Error canceling speech synthesis:", err);
    }

    if (isMuted) {
      setIsSpeaking(false);
      // If voice activation is enabled, automatically start recording after a tiny delay
      if (voiceActivation) {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = setTimeout(() => startVoiceRecognition(), 800);
      }
      return;
    }

    try {
      // Resume queue in case Chrome is stuck on pause
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.error("Error resuming speech synthesis:", err);
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Save strong reference in memory to avoid Chrome V8 garbage collection bugs
      utteranceRef.current = utterance;
      
      // Safe voice assignment: Prefer local-service offline voices to prevent silent failures!
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = ttsSpeed;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Auto-trigger voice input when AI finishes speaking (hands-free experience)
        if (voiceActivation) {
          startVoiceRecognition();
        }
      };

      utterance.onerror = (e) => {
        console.error("Speech Synthesis error:", e);
        setIsSpeaking(false);
        // Fail-safe: even if speech fails, automatically trigger microphone so user is not stuck!
        if (voiceActivation) {
          startVoiceRecognition();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Error instantiating or speaking utterance:", err);
      setIsSpeaking(false);
      if (voiceActivation) {
        startVoiceRecognition();
      }
    }
  }, [isMuted, selectedVoice, ttsSpeed, voiceActivation, startVoiceRecognition]);

  // Load adaptive questions directly from backend FastAPI hooks!
  const loadNextQuestion = useCallback(async (prevAnswer = null) => {
    setPhase('loading');
    setEvaluation(null);
    setShowEval(false);
    setAnswerText('');
    setIsSpeaking(true);

    try {
      // Call actual REST hook from backend
      const data = await getNextQuestion(sessionId, prevAnswer);
      setCurrentQuestion(data); // Returns { question, question_id, session_id }
      
      // Update transcript
      setTranscript((prev) => [...prev, { role: 'ai', text: data.question }]);
      setPhase('question');
      
      // Trigger Audio Synthesis with a small delay to settle state
      setTimeout(() => {
        speakQuestion(data.question);
      }, 400);

    } catch (err) {
      console.error("Error fetching next question:", err);
      setPhase('question');
      setIsSpeaking(false);
    }
  }, [questionIdx, sessionId, getNextQuestion, speakQuestion]);

  // Submit verbally or typed responses to backend FastAPI evaluate hooks
  const handleSubmitAnswer = async (manualText = null) => {
    const textToSubmit = manualText || answerText;
    if (!textToSubmit.trim()) return;

    // Turn off recording if active
    if (isRecording) {
      stopVoiceRecognition();
    }

    setAnswerText('');
    setPhase('evaluating');
    setTranscript((prev) => [...prev, { role: 'user', text: textToSubmit }]);

    try {
      // Call evaluate-answer API endpoint in backend
      const evalResult = await evaluateAnswer(sessionId, currentQuestion?.question_id || "q_1", textToSubmit);
      
      setEvaluation(evalResult);
      setShowEval(true);

      // Append evaluation details to the last transcript entry
      setTranscript((prev) => {
        const copy = [...prev];
        if (copy.length > 0) {
          copy[copy.length - 1] = { ...copy[copy.length - 1], eval: evalResult };
        }
        return copy;
      });

      // Pause briefly to let candidate view feedback, then trigger next adaptive question
      if (questionIdx + 1 >= MAX_QUESTIONS) {
        setPhase('complete');
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setQuestionIdx((i) => i + 1);
          loadNextQuestion(textToSubmit);
        }, 5000);
      }

    } catch (err) {
      console.error("Error evaluating answer:", err);
      setPhase('question');
    }
  };
  handleSubmitAnswerRef.current = handleSubmitAnswer;

  // Complete session and redirect to analytics report
  const handleFinish = async () => {
    clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.error("Error canceling speech synthesis on finish:", e);
      }
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.error("Error aborting speech recognition on finish:", e);
      }
      recognitionRef.current = null;
    }

    try {
      await completeSession(sessionId);
    } catch (e) {
      console.error("Error finalizing session:", e);
    }
    navigate(`/report/${sessionId}`);
  };

  // Toggle voice input button
  const handleMicToggle = () => {
    if (isRecording) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const progress = Math.min((questionIdx / MAX_QUESTIONS) * 100, 100);
  const remaining = totalSeconds - elapsedSeconds;
  const isLowTime = remaining < 300;

  // Render pre-interview Video Call Lobby Screen
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 bg-gradient-to-b from-slate-950 to-slate-900 select-none animate-fade-in">
        <motion.div 
          className="w-full max-w-3xl bg-slate-900/60 border border-slate-800 p-8 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500" />

          {/* Lobby Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center mb-3 shadow-glow shadow-blue-500/20 animate-float">
              <Brain size={24} />
            </div>
            <h2 className="text-2xl font-extrabold tracking-wide">Interview Lobby Room</h2>
            <p className="text-slate-400 text-sm mt-1">Configure your sound and connect your headphones before entering</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Device Sound-Check */}
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 text-center flex flex-col items-center gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Device Calibration</span>
              
              <div className="relative">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-slate-900 border ${
                  micActiveTest ? 'border-purple-500 bg-purple-500/10 shadow-glow shadow-purple-500/20' : 'border-slate-800'
                }`}>
                  <Headphones size={32} className={micActiveTest ? 'text-purple-400' : 'text-slate-500'} />
                </div>
                {micActiveTest && (
                  <motion.div
                    className="absolute -inset-2 rounded-full border border-purple-500/30 animate-pulse-ring"
                    initial={{ scale: 1, opacity: 0.6 }}
                  />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-200">Headphone Connection Check</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  Put on your headphones to hear the AI Interviewer and avoid echoing during response.
                </p>
              </div>

              {!micActiveTest ? (
                <button
                  onClick={handleTestMic}
                  className="px-4 py-2 border border-slate-700 hover:border-slate-500 bg-slate-900 rounded-lg text-xs font-semibold hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Mic size={12} /> Test Microphone
                </button>
              ) : (
                <span className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> Mic Connected
                </span>
              )}
            </div>

            {/* Right: Join Call Trigger */}
            <div className="flex flex-col gap-5 justify-center">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-200">Simulation details:</h4>
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 flex justify-between">
                    <span>Active Profile:</span> <strong className="text-slate-200 capitalize">Technical</strong>
                  </p>
                  <p className="text-xs text-slate-400 flex justify-between">
                    <span>Job Role Target:</span> <strong className="text-slate-200 capitalize">Software Engineer</strong>
                  </p>
                  <p className="text-xs text-slate-400 flex justify-between">
                    <span>Interview Duration:</span> <strong className="text-slate-200">30 minutes</strong>
                  </p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-300 leading-relaxed">
                📢 **Important**: Clicking **"Join Interview Call"** will trigger audio question synthesis immediately. Ensure your sound volume is active!
              </div>

              <button
                onClick={handleJoinCall}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-extrabold hover:shadow-glow hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Video size={16} fill="white" />
                Join Interview Call
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      
      {/* ─── Premium Header HUD ─── */}
      <div className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-900/40 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-glow shadow-blue-500/20">
            <Brain size={16} />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">InterviewAI Viewport</span>
            <span className="text-xs text-slate-500 block">Active Adaptive Simulation</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress Counters */}
          <div className="bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs text-slate-300 font-medium">
            <MessageCircle size={14} className="text-purple-400" />
            Question {questionIdx + 1} of {MAX_QUESTIONS}
          </div>

          {/* Time Remaining */}
          <div className={`bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-mono text-sm font-bold ${
            isLowTime ? 'text-red-400 shadow-glow shadow-red-500/20 animate-pulse' : 'text-slate-300'
          }`}>
            <Clock size={15} className={isLowTime ? 'text-red-400' : 'text-slate-400'} />
            {formatTime(remaining)}
          </div>

          {/* Terminate Session */}
          <button
            onClick={handleFinish}
            className="px-4 py-1.5 text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-1.5"
          >
            <LogOut size={13} />
            End Session
          </button>
        </div>
      </div>

      {/* Progress HUD bar */}
      <div className="h-1 bg-slate-900">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 shadow-glow shadow-purple-500/50" 
          animate={{ width: `${progress}%` }} 
          transition={{ duration: 0.5 }} 
        />
      </div>

      {/* ─── Immersive Main Call Viewport ─── */}
      <div className="flex-1 flex relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        
        {/* Cinematic centered visualizer portal */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
          
          {/* Animated circular background fields */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-20">
            <motion.div 
              className="w-[450px] h-[450px] rounded-full border border-blue-500/20 absolute"
              animate={isSpeaking ? { scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] } : {}}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div 
              className="w-[300px] h-[300px] rounded-full border border-purple-500/10 absolute"
              animate={isSpeaking ? { scale: [1.1, 0.95, 1.1], opacity: [0.1, 0.3, 0.1] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>

          <AnimatePresence mode="wait">
            {phase === 'loading' ? (
              <motion.div 
                key="loading-orb" 
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative flex justify-center items-center">
                  <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center">
                    <Loader2 size={36} className="animate-spin text-blue-400" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-blue-300 tracking-widest uppercase">Analyzing Progress...</p>
              </motion.div>
            ) : phase === 'complete' ? (
              <motion.div 
                key="complete-panel" 
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center max-w-md backdrop-blur shadow-glow shadow-green-500/10 relative z-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/50">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h3 className="font-extrabold text-2xl mb-2 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">Interview Complete!</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Excellent practice. Our scoring models have compiled your communication, technical, and speaking metrics.
                </p>
                <button
                  onClick={handleFinish}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-bold hover:shadow-glow hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  View Performance Analytics <ChevronRight size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="interviewer-orb" 
                className="flex flex-col items-center gap-6 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Immersive centered virtual avatar */}
                <div className="relative">
                  <motion.div
                    className={`w-32 h-32 rounded-full bg-gradient-to-tr from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center shadow-2xl border ${
                      isSpeaking ? 'border-blue-400/80 shadow-glow shadow-blue-500/40 animate-pulse' : 'border-slate-800'
                    }`}
                    animate={isSpeaking ? { scale: [1, 1.04, 1] } : {}}
                    transition={{ duration: 1.5, repeat: isSpeaking ? Infinity : 0 }}
                  >
                    <div className="w-28 h-28 rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
                      {isSpeaking ? (
                        <Brain size={48} className="text-blue-400 animate-pulse-slow" />
                      ) : isRecording ? (
                        <Brain size={48} className="text-purple-400 animate-bounce" />
                      ) : (
                        <Brain size={48} className="text-slate-600" />
                      )}
                      
                      {/* Interactive dynamic background lighting */}
                      {isSpeaking && (
                        <div className="absolute inset-0 bg-blue-500/10 mix-blend-color-dodge filter blur-md animate-pulse" />
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Glowing active speak ring */}
                  {isSpeaking && (
                    <motion.div
                      className="absolute -inset-3 rounded-full border-2 border-blue-400/30"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-300">AI Virtual Interviewer</p>
                  <p className={`text-xs font-semibold ${isSpeaking ? 'text-blue-400 animate-pulse' : isRecording ? 'text-purple-400' : 'text-slate-500'}`}>
                    {isSpeaking ? 'Speaking to headphones…' : isRecording ? 'Listening...' : 'Standing by'}
                  </p>
                </div>

                {/* ─── speaking Equalizer waveform bars ─── */}
                <div className="h-10 flex items-center gap-1.5 justify-center mt-2 w-64">
                  {isSpeaking ? (
                    // Active AI voice output waves
                    Array.from({ length: 15 }).map((_, idx) => {
                      const dur = 0.5 + Math.random() * 0.8;
                      return (
                        <motion.div
                          key={idx}
                          className="w-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full"
                          animate={{ height: [8, 36, 8] }}
                          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
                        />
                      );
                    })
                  ) : isRecording ? (
                    // Listening wait wave pulses
                    <div className="text-xs text-purple-400 font-semibold tracking-wide flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping" />
                      Speak your response...
                    </div>
                  ) : (
                    // Silent flat waves
                    Array.from({ length: 15 }).map((_, idx) => (
                      <div key={idx} className="w-1 h-2 bg-slate-800 rounded-full" />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Captions / Subtitles Overlay ─── */}
          {phase === 'question' && currentQuestion && (
            <motion.div 
              className="absolute bottom-6 left-8 right-8 bg-slate-950/80 border border-slate-900/60 px-6 py-4 rounded-xl text-center backdrop-blur max-w-3xl mx-auto shadow-2xl"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
                <Volume2 size={12} /> Spoken Question
              </p>
              <p className="text-base text-slate-100 font-medium leading-relaxed">
                "{currentQuestion.question}"
              </p>
            </motion.div>
          )}

          {/* ─── Active verbal response overlay ─── */}
          {isRecording && answerText && (
            <motion.div 
              className="absolute bottom-6 left-8 right-8 bg-purple-950/30 border border-purple-500/20 px-6 py-4 rounded-xl text-center backdrop-blur max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <Mic size={12} /> Live Speech Subtitles
              </p>
              <p className="text-sm text-purple-200 leading-relaxed italic">
                "{answerText}..."
              </p>
            </motion.div>
          )}

          {/* ─── Evaluation Pill (Popup on Speak) ─── */}
          {showEval && evaluation && (
            <motion.div 
              className="absolute top-6 left-8 right-8 bg-slate-900/90 border border-slate-800 p-4 rounded-xl backdrop-blur max-w-xl mx-auto shadow-2xl flex items-center justify-between"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <div className="flex-1 pr-4">
                <p className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <BarChart2 size={13} /> Immediate Evaluation
                </p>
                <p className="text-xs text-slate-300 leading-relaxed truncate-2-lines">{evaluation.feedback}</p>
              </div>
              <div className="flex gap-4 border-l border-slate-800 pl-4 items-center">
                <div className="text-center">
                  <span className="text-sm font-bold text-blue-400 block">{Math.round(evaluation.technical_score)}/10</span>
                  <span className="text-[10px] text-slate-500 block uppercase">Tech</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-purple-400 block">{Math.round(evaluation.communication_score)}/10</span>
                  <span className="text-[10px] text-slate-500 block uppercase">Comm</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ─── Interactive Keyboard / Text Fallback Drawer ─── */}
        <AnimatePresence>
          {showTextDrawer && (
            <motion.div 
              className="w-96 border-l border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col h-full shadow-2xl relative z-10"
              initial={{ x: 380, opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
                <div className="flex items-center gap-2">
                  <Keyboard size={16} className="text-blue-400" />
                  <span className="font-bold text-sm tracking-wide">Transcript & Text Input</span>
                </div>
                <button 
                  onClick={() => setShowTextDrawer(false)}
                  className="text-xs px-2.5 py-1 border border-slate-700 rounded text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                >
                  Hide
                </button>
              </div>

              {/* Chat Timeline scrolling logs */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {transcript.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">No questions loaded yet.</p>
                ) : (
                  transcript.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[260px] ${
                        msg.role === 'ai' 
                          ? 'bg-slate-800/80 border border-slate-750 text-slate-200 rounded-2xl rounded-tl-sm'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-sm'
                      } px-3.5 py-2.5 text-xs leading-relaxed`}>
                        <p className="font-semibold text-[10px] opacity-60 mb-1">
                          {msg.role === 'ai' ? 'AI INTERVIEWER' : 'YOU'}
                        </p>
                        {msg.text}
                        
                        {msg.role === 'user' && msg.eval && (
                          <div className="flex gap-2.5 border-t border-white/10 mt-1.5 pt-1.5 text-[9px] text-white/70">
                            <span>Tech: <strong className="text-white">{Math.round(msg.eval.technical_score)}/10</strong></span>
                            <span>Comm: <strong className="text-white">{Math.round(msg.eval.communication_score)}/10</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Manual input box for texting */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/40">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={2}
                    className="flex-1 px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-xs text-white placeholder-slate-500 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitAnswer();
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSubmitAnswer()}
                    disabled={!answerText.trim() || phase === 'loading' || phase === 'evaluating'}
                    className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-1.5">Enter to submit · Shift+Enter for newline</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Floating Picture-in-Picture Candidate Mic/Cam View ─── */}
        <div className="absolute bottom-6 right-6 w-36 h-24 rounded-xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center p-3 z-10 backdrop-blur-md">
          <div className="relative mb-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border ${isRecording ? 'border-purple-500' : 'border-slate-700'}`}>
              {isRecording ? (
                <Mic size={14} className="text-purple-400 animate-pulse" />
              ) : (
                <MicOff size={14} className="text-slate-500" />
              )}
            </div>
            {isRecording && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-300 block">Candidate Mic</span>
          <span className="text-[8px] text-slate-500 block truncate w-full">
            {isRecording ? 'Capturing Audio...' : 'Muted'}
          </span>
        </div>
      </div>

      {/* ─── Floating Settings Panel Overlay ─── */}
      <AnimatePresence>
        {showSettingsDropdown && (
          <motion.div 
            className="absolute bottom-24 left-6 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl w-64 z-20 backdrop-blur"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Interviewer Voice Settings</h4>
            
            {/* Speed selection */}
            <div className="mb-4">
              <label className="text-[10px] text-slate-400 block mb-1">Text-to-Speech Speed</label>
              <div className="flex gap-2">
                {[0.8, 1.0, 1.2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTtsSpeed(s)}
                    className={`flex-1 py-1 text-xs rounded border font-semibold transition-all ${
                      ttsSpeed === s 
                        ? 'bg-blue-500 border-blue-400 text-white' 
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s === 1.0 ? 'Normal' : `${s}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* Hands-Free Activation toggle */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Auto-Listen (Hands-Free)</span>
                <span className="text-[9px] text-slate-500 block">Microphone wakes automatically</span>
              </div>
              <button
                onClick={() => setVoiceActivation(!voiceActivation)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  voiceActivation ? 'bg-purple-600' : 'bg-slate-750'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-200 ${
                  voiceActivation ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom Cinematic Control Panel HUD ─── */}
      {phase !== 'complete' && (
        <div className="border-t border-slate-900 bg-slate-950 px-6 py-5 flex items-center justify-between z-10 sticky bottom-0">
          
          {/* Settings trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className={`p-2.5 rounded-lg border transition-all ${
                showSettingsDropdown 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Voice Settings"
            >
              <Settings size={18} />
            </button>

            {/* TTS Mute Toggle */}
            <button
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (nextMute && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              className={`p-2.5 rounded-lg border transition-all ${
                isMuted 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          {/* Active central verbal control button */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleMicToggle}
              disabled={phase === 'loading' || phase === 'evaluating'}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed relative ${
                isRecording
                  ? 'bg-red-500 text-white shadow-glow shadow-red-500/40 border border-red-400/50'
                  : 'bg-gradient-to-tr from-blue-500 to-purple-600 text-white shadow-glow shadow-blue-500/30'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? <Square size={20} fill="white" /> : <Mic size={20} />}
              
              {/* Outer pulsing red wave */}
              {isRecording && (
                <div className="recording-pulse" />
              )}
            </motion.button>
            
            {/* Quick manual submit verbal response */}
            {isRecording && answerText && (
              <motion.button
                onClick={() => handleSubmitAnswer()}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                Submit Answer
              </motion.button>
            )}
          </div>

          {/* Keyboard input mode trigger */}
          <div>
            <button
              onClick={() => setShowTextDrawer(!showTextDrawer)}
              className={`px-4 py-2 rounded-lg border transition-all text-xs font-bold flex items-center gap-1.5 ${
                showTextDrawer 
                  ? 'bg-blue-500 border-blue-400 text-white shadow-glow shadow-blue-500/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard size={15} />
              {showTextDrawer ? 'Cinematic Mode' : 'Text Input Fallback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
