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

const DEMO_QUESTIONS = [
  "Can you explain the difference between a list and a tuple in Python, and when you would use each?",
  "What is a Load Balancer, and why is it important in scaling a web application?",
  "Tell me about a time you had a disagreement with a team member. How did you handle it and what was the outcome?"
];

export default function LiveInterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  // Real REST context hooks from InterviewContext
  const { getNextQuestion, evaluateAnswer, completeSession, getSession } = useInterview();

  // Core state variables: default to 'lobby' to bypass browser user-activation restrictions for audio synthesis!
  const [phase, setPhase] = useState('lobby'); // lobby | loading | question | answering | evaluating | complete
  const [thinkingTextIdx, setThinkingTextIdx] = useState(0);
  const thinkingTexts = [
    "Analyzing Response",
    "Preparing Follow-up Question",
    "Generating Feedback"
  ];
  useEffect(() => {
    let interval;
    if (phase === 'loading' || phase === 'evaluating') {
      interval = setInterval(() => {
        setThinkingTextIdx((idx) => (idx + 1) % thinkingTexts.length);
      }, 1500);
    } else {
      setThinkingTextIdx(0);
    }
    return () => clearInterval(interval);
  }, [phase]);
  const [sessionConfig, setSessionConfig] = useState(null);
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
  
  const MAX_QUESTIONS = sessionId?.startsWith('demo') ? 3 : 5;

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

  // Auth check and load session details
  useEffect(() => {
    if (sessionId.startsWith('demo')) {
      // Mock session config for demo
      setSessionConfig({
        interview_type: 'technical',
        job_role: 'software_engineer',
        difficulty: 'sde_1',
        duration_minutes: 15
      });
    } else {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      // Fetch session details
      getSession(sessionId).then((data) => {
        if (data && data.config) {
          setSessionConfig(data.config);
        }
      }).catch((err) => {
        console.error("Failed to load session info:", err);
      });
    }
  }, [sessionId, navigate, getSession]);

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

    if (sessionId.startsWith('demo')) {
      // Simulate network latency for demo
      setTimeout(() => {
        const questionText = DEMO_QUESTIONS[questionIdx];
        const data = {
          question: questionText,
          question_id: `demo_q_${questionIdx + 1}`,
          session_id: sessionId
        };
        setCurrentQuestion(data);
        setTranscript((prev) => [...prev, { role: 'ai', text: data.question }]);
        setPhase('question');
        setTimeout(() => {
          speakQuestion(data.question);
        }, 400);
      }, 800);
      return;
    }

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

    if (sessionId.startsWith('demo')) {
      // Simulate local evaluate for demo
      setTimeout(() => {
        const mockEval = {
          technical_score: 8.0,
          communication_score: 7.5,
          confidence_score: 8.0,
          overall_score: 7.8,
          feedback: "Great answer for a demo interview! Keep practicing to access deeper insights.",
          strengths: ["Clear response structure"],
          weaknesses: ["Could expand on definitions"],
          improvements: ["Provide more concrete examples"]
        };
        setEvaluation(mockEval);
        setShowEval(true);

        setTranscript((prev) => {
          const copy = [...prev];
          if (copy.length > 0) {
            copy[copy.length - 1] = { ...copy[copy.length - 1], eval: mockEval };
          }
          return copy;
        });

        if (questionIdx + 1 >= MAX_QUESTIONS) {
          setPhase('complete');
        } else {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setQuestionIdx((i) => i + 1);
            loadNextQuestion(textToSubmit);
          }, 5000);
        }
      }, 1500);
      return;
    }

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

    if (!sessionId.startsWith('demo')) {
      try {
        await completeSession(sessionId);
      } catch (e) {
        console.error("Error finalizing session:", e);
      }
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
      <motion.div 
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="min-h-screen bg-background text-text-primary flex flex-col justify-center items-center p-6 select-none w-full"
      >
        <motion.div 
          className="w-full max-w-2xl bg-surface border border-border p-8 rounded-xl shadow-lg relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Lobby Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-12 h-12 rounded-xl border border-border bg-surface-secondary flex items-center justify-center mb-4 text-primary">
              <Brain size={22} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Interview Lobby Room</h2>
            <p className="text-text-secondary text-xs mt-1">Configure your sound and verify connectivity before entering.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Left: Device Calibration */}
            <div className="bg-surface-secondary border border-border rounded-xl p-5 text-center flex flex-col items-center justify-between gap-4">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Device Calibration</span>
              
              <div className="relative my-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-surface border transition-all ${
                  micActiveTest ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                  <Headphones size={26} className={micActiveTest ? 'text-primary' : 'text-text-secondary'} />
                </div>
                {micActiveTest && (
                  <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse-ring" />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-text-primary">Use Headphones</p>
                <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                  Put on headphones to clearly hear the AI and prevent echoing.
                </p>
              </div>

              {!micActiveTest ? (
                <button
                  onClick={handleTestMic}
                  className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs"
                >
                  <Mic size={12} /> Test Microphone
                </button>
              ) : (
                <span className="text-[10px] text-success font-bold bg-success/10 border border-success/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> Mic Configured
                </span>
              )}
            </div>

            {/* Right: Simulation details */}
            <div className="flex flex-col gap-6 justify-between">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Simulation Parameters</h4>
                <div className="space-y-2 border border-border rounded-lg p-3.5 bg-surface-secondary/40">
                  <div className="text-xs text-text-secondary flex justify-between">
                    <span>Interview Profile</span>
                    <strong className="text-text-primary capitalize">
                      {sessionConfig?.interview_type?.replace('_', ' ') || 'Technical'}
                    </strong>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="text-xs text-text-secondary flex justify-between">
                    <span>Target Role</span>
                    <strong className="text-text-primary capitalize">
                      {sessionConfig?.job_role?.replace(/_/g, ' ') || 'Software Engineer'}
                    </strong>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="text-xs text-text-secondary flex justify-between">
                    <span>Difficulty</span>
                    <strong className="text-text-primary capitalize">
                      {sessionConfig?.difficulty || 'Intermediate'}
                    </strong>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="text-xs text-text-secondary flex justify-between">
                    <span>Session Duration</span>
                    <strong className="text-text-primary">
                      {sessionConfig?.duration_minutes || '30'} Minutes
                    </strong>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-[11px] text-text-secondary leading-relaxed">
                ℹ️ **Note**: Enters the active room immediately. Ensure your speaker volume is turned up.
              </div>

              <button
                onClick={handleJoinCall}
                className="btn-primary py-3 flex items-center justify-center gap-2 text-sm font-semibold w-full"
              >
                <Video size={16} />
                Join Interview Call
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-background text-text-primary flex flex-col overflow-hidden select-none w-full"
    >
      
      {/* ─── Premium Header HUD ─── */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-surface/50 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-border bg-surface-secondary flex items-center justify-center text-primary">
            <Brain size={16} />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-text-primary">
              InterviewAI Viewport — <span className="text-primary capitalize">{sessionConfig?.difficulty || 'Intermediate'}</span>
            </span>
            <span className="text-[10px] text-text-muted block">Active Adaptive Simulation</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress Counters */}
          <div className="bg-surface-secondary border border-border px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-text-secondary font-medium">
            <MessageCircle size={14} className="text-primary" />
            Question {questionIdx + 1} of {MAX_QUESTIONS}
          </div>

          {/* Time Remaining */}
          <div className={`bg-surface-secondary border border-border px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-sm font-semibold ${
            isLowTime ? 'text-danger animate-pulse' : 'text-text-primary'
          }`}>
            <Clock size={14} className={isLowTime ? 'text-danger' : 'text-text-secondary'} />
            {formatTime(remaining)}
          </div>

          {/* Terminate Session */}
          <button
            onClick={handleFinish}
            className="px-3.5 py-1.5 text-xs font-semibold bg-danger/10 border border-danger/20 hover:border-danger/30 text-danger rounded-lg transition-all flex items-center gap-1.5"
          >
            <LogOut size={13} />
            End Session
          </button>
        </div>
      </div>

      {/* Progress HUD bar */}
      <div className="h-1 bg-surface-secondary">
        <motion.div 
          className="h-full bg-primary" 
          animate={{ width: `${progress}%` }} 
          transition={{ duration: 0.5 }} 
        />
      </div>

      {/* ─── Immersive Main Call Viewport ─── */}
      <div className="flex-1 flex relative overflow-hidden bg-background">
        
        {/* Cinematic centered visualizer portal */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
          
          {/* Animated circular background fields */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-25">
            <motion.div 
              className="w-[400px] h-[400px] rounded-full border border-primary/10 absolute"
              animate={isSpeaking ? { scale: [1, 1.12, 1], opacity: [0.15, 0.3, 0.15] } : {}}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div 
              className="w-[280px] h-[280px] rounded-full border border-primary/5 absolute"
              animate={isSpeaking ? { scale: [1.08, 0.96, 1.08], opacity: [0.08, 0.2, 0.08] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>

          <AnimatePresence mode="wait">
            {phase === 'loading' || phase === 'evaluating' ? (
              <motion.div 
                key="thinking-orb" 
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Pulsing container instead of spinner */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <motion.div 
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-full"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center shadow-md">
                    <Brain size={20} className="text-primary animate-pulse" />
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    {thinkingTexts[thinkingTextIdx]}
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Please stand by</p>
                </div>
              </motion.div>
            ) : phase === 'complete' ? (
              <motion.div 
                key="complete-panel" 
                className="bg-surface border border-border rounded-xl p-8 text-center max-w-sm relative z-10 shadow-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4 text-success">
                  <CheckCircle size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-text-primary">Interview Complete!</h3>
                <p className="text-text-secondary text-xs mb-6 leading-relaxed">
                  Excellent practice. Our scoring models have compiled your communication, technical, and speaking metrics.
                </p>
                <button
                  onClick={handleFinish}
                  className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  View Performance Analytics <ChevronRight size={14} />
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
                    className={`w-28 h-28 rounded-full bg-surface flex items-center justify-center border shadow-xl transition-all duration-300 ${
                      isSpeaking ? 'border-primary' : isRecording ? 'border-danger' : 'border-border'
                    }`}
                    animate={isSpeaking ? { scale: [1, 1.03, 1] } : isRecording ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 1.5, repeat: (isSpeaking || isRecording) ? Infinity : 0 }}
                  >
                    <div className="w-24 h-24 rounded-full bg-surface-secondary flex items-center justify-center relative overflow-hidden">
                      {isSpeaking ? (
                        <Brain size={36} className="text-primary animate-pulse-slow" />
                      ) : isRecording ? (
                        <Brain size={36} className="text-danger animate-pulse" />
                      ) : (
                        <Brain size={36} className="text-text-muted" />
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Glowing active speak ring */}
                  {isSpeaking && (
                    <motion.div
                      className="absolute -inset-2.5 rounded-full border border-primary/20"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Pulsing microphone ring (Voice Mode Active) */}
                  {isRecording && (
                    <motion.div
                      className="absolute -inset-2.5 rounded-full border border-danger/30"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">AI Virtual Interviewer</p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${isSpeaking ? 'text-primary' : isRecording ? 'text-danger' : 'text-text-muted'}`}>
                    {isSpeaking ? 'Speaking to headphones…' : isRecording ? 'Listening...' : 'Standing by'}
                  </p>
                </div>

                {/* Waveform Equalizer */}
                <div className="h-8 flex items-center gap-1.5 justify-center mt-2 w-64">
                  {isSpeaking ? (
                    Array.from({ length: 15 }).map((_, idx) => {
                      const dur = 0.5 + Math.random() * 0.8;
                      return (
                        <motion.div
                          key={idx}
                          className="w-1 bg-primary rounded-full"
                          animate={{ height: [6, 28, 6] }}
                          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
                        />
                      );
                    })
                  ) : isRecording ? (
                    <div className="flex items-center gap-1 h-6">
                      {Array.from({ length: 11 }).map((_, idx) => {
                        const baseHeight = idx === 5 ? 24 : idx % 2 === 0 ? 8 : 16;
                        return (
                          <motion.div
                            key={idx}
                            className="w-1 bg-danger rounded-full"
                            animate={{ height: [4, baseHeight, 4] }}
                            transition={{ 
                              duration: 0.5 + Math.random() * 0.4, 
                              repeat: Infinity, 
                              ease: "easeInOut",
                              delay: idx * 0.04
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    Array.from({ length: 15 }).map((_, idx) => (
                      <div key={idx} className="w-1 h-1.5 bg-border rounded-full" />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Captions / Subtitles Overlay */}
          {phase === 'question' && currentQuestion && (
            <motion.div 
              className="absolute bottom-6 left-6 right-6 bg-surface border border-border px-6 py-4 rounded-xl text-center backdrop-blur-md max-w-2xl mx-auto shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
                <Volume2 size={12} /> Spoken Question
              </p>
              <p className="text-sm text-text-primary font-medium leading-relaxed">
                "{currentQuestion.question}"
              </p>
            </motion.div>
          )}

          {/* Active verbal response overlay */}
          {isRecording && answerText && (
            <motion.div 
              className="absolute bottom-6 left-6 right-6 bg-primary/5 border border-primary/20 px-6 py-4 rounded-xl text-center backdrop-blur-md max-w-xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <Mic size={12} /> Live Speech Subtitles
              </p>
              <p className="text-xs text-text-secondary leading-relaxed italic">
                "{answerText}..."
              </p>
            </motion.div>
          )}

          {/* Immediate Evaluation Overlay */}
          {showEval && evaluation && (
            <motion.div 
              className="absolute top-6 left-6 right-6 bg-surface border border-border p-4 rounded-xl backdrop-blur-md max-w-lg mx-auto shadow-lg flex items-center justify-between"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex-1 pr-4 min-w-0">
                <p className="text-[10px] text-success font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <BarChart2 size={12} /> Immediate Feedback
                </p>
                <p className="text-xs text-text-secondary leading-relaxed truncate">{evaluation.feedback}</p>
              </div>
              <div className="flex gap-4 border-l border-border pl-4 items-center">
                <div className="text-center">
                  <span className="text-xs font-mono font-bold text-primary block">{Math.round(evaluation.technical_score)}/10</span>
                  <span className="text-[9px] text-text-muted block uppercase">Tech</span>
                </div>
                <div className="text-center">
                  <span className="text-xs font-mono font-bold text-success block">{Math.round(evaluation.communication_score)}/10</span>
                  <span className="text-[9px] text-text-muted block uppercase">Comm</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ─── Interactive Keyboard / Text Fallback Drawer ─── */}
        <AnimatePresence>
          {showTextDrawer && (
            <motion.div 
              className="w-96 border-l border-border bg-surface flex flex-col h-full shadow-lg relative z-10"
              initial={{ x: 380, opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface-secondary/40">
                <div className="flex items-center gap-2">
                  <Keyboard size={15} className="text-primary" />
                  <span className="font-bold text-xs tracking-tight text-text-primary">Transcript & Text Input</span>
                </div>
                <button 
                  onClick={() => setShowTextDrawer(false)}
                  className="btn-secondary py-1 px-2.5 text-[10px]"
                >
                  Hide
                </button>
              </div>

              {/* Chat timeline logs */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {transcript.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-10">No questions loaded yet.</p>
                ) : (
                  transcript.map((msg, i) => (
                    <motion.div 
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: msg.role === 'user' ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: msg.role === 'user' ? 0.15 : 0.25, 
                        ease: "easeOut"
                      }}
                    >
                      <div className={`max-w-[260px] ${
                        msg.role === 'ai' 
                          ? 'bg-surface-secondary border border-border text-text-primary rounded-xl rounded-tl-none'
                          : 'bg-primary text-white rounded-xl rounded-tr-none'
                      } px-3.5 py-2.5 text-xs leading-relaxed`}>
                        <p className={`font-mono text-[9px] uppercase tracking-wider mb-1 ${msg.role === 'ai' ? 'text-primary' : 'text-white/60'}`}>
                          {msg.role === 'ai' ? 'AI INTERVIEWER' : 'YOU'}
                        </p>
                        {msg.text}
                        
                        {msg.role === 'user' && msg.eval && (
                          <div className="flex gap-2.5 border-t border-white/10 mt-2 pt-2 text-[9px] text-white/70">
                            <span>Tech: <strong className="text-white font-mono">{Math.round(msg.eval.technical_score)}/10</strong></span>
                            <span>Comm: <strong className="text-white font-mono">{Math.round(msg.eval.communication_score)}/10</strong></span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Input console */}
              <div className="p-4 border-t border-border bg-surface-secondary/40">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Type your response..."
                    rows={2}
                    className="input-field resize-none py-1.5"
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
                    className="btn-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                  >
                    <Send size={13} />
                  </button>
                </div>
                <p className="text-[9px] text-text-muted text-center mt-2">Enter to submit · Shift+Enter for newline</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Candidate Mic View */}
        <div className="absolute bottom-6 right-6 w-32 h-20 rounded-xl border border-border bg-surface/95 shadow-md flex flex-col items-center justify-center text-center p-3 z-10 backdrop-blur-md">
          <div className="relative mb-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-surface-secondary border transition-all ${isRecording ? 'border-primary' : 'border-border'}`}>
              {isRecording ? (
                <Mic size={12} className="text-primary animate-pulse" />
              ) : (
                <MicOff size={12} className="text-text-muted" />
              )}
            </div>
            {isRecording && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-danger rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[9px] font-bold text-text-primary block">Candidate Mic</span>
          <span className="text-[8px] text-text-muted block truncate w-full mt-0.5">
            {isRecording ? 'Active' : 'Muted'}
          </span>
        </div>
      </div>

      {/* Floating Settings Panel */}
      <AnimatePresence>
        {showSettingsDropdown && (
          <motion.div 
            className="absolute bottom-24 left-6 bg-surface border border-border p-4 rounded-xl shadow-lg w-64 z-20 backdrop-blur-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Interviewer Speed</h4>
            
            {/* Speed selection */}
            <div className="mb-4">
              <div className="flex gap-2">
                {[0.8, 1.0, 1.2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTtsSpeed(s)}
                    className={`flex-1 py-1 text-xs rounded border transition-all font-medium ${
                      ttsSpeed === s 
                        ? 'bg-primary border-primary text-white' 
                        : 'border-border bg-surface-secondary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s === 1.0 ? 'Normal' : `${s}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* Hands-Free Activation toggle */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                <span className="text-xs font-semibold text-text-primary block">Auto-Listen</span>
                <span className="text-[8px] text-text-muted block mt-0.5">Microphone triggers automatically</span>
              </div>
              <button
                onClick={() => setVoiceActivation(!voiceActivation)}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  voiceActivation ? 'bg-primary' : 'bg-surface-secondary border border-border'
                }`}
              >
                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition-transform duration-200 ${
                  voiceActivation ? 'translate-x-3.5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Cinematic Control Panel HUD */}
      {phase !== 'complete' && (
        <div className="border-t border-border bg-surface px-6 py-5 flex items-center justify-between z-10 sticky bottom-0">
          
          {/* Settings triggers */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className={`p-2.5 rounded-lg border transition-all ${
                showSettingsDropdown 
                  ? 'bg-surface-secondary border-border text-text-primary' 
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
              title="Voice Settings"
            >
              <Settings size={16} />
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
                  ? 'bg-danger/10 border-danger/30 text-danger' 
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
              title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* Active central verbal control button */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleMicToggle}
              disabled={phase === 'loading' || phase === 'evaluating'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed relative ${
                isRecording
                  ? 'bg-danger text-white border border-danger/50 shadow-md'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-md'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? <Square size={16} fill="white" /> : <Mic size={16} />}
              
              {/* Outer pulsing red wave */}
              {isRecording && (
                <div className="recording-pulse" />
              )}
            </motion.button>
            
            {/* Quick manual submit response */}
            {isRecording && answerText && (
              <motion.button
                onClick={() => handleSubmitAnswer()}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                initial={{ opacity: 0, x: -5 }}
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
              className={`px-3.5 py-2 rounded-lg border transition-all text-xs font-semibold flex items-center gap-1.5 ${
                showTextDrawer 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <Keyboard size={14} />
              {showTextDrawer ? 'Cinematic Mode' : 'Text Input Fallback'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
