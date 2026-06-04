import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, TrendingUp, AlertTriangle, BookOpen, ChevronLeft,
  Download, Play, Brain, Star, CheckCircle, XCircle, Lightbulb, BarChart2, Loader2, ArrowRight
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useInterview } from '../context/InterviewContext';

// Curated high-fidelity mock report for guest demo mode
const MOCK_REPORT = {
  overall_score: 78,
  technical_score: 80,
  communication_score: 77,
  confidence_score: 78,
  strengths: [
    'Robust conceptual mapping of mutable versus immutable data collections.',
    'Accurate explanation of reverse proxy load balancing and system redundancy.',
    'Structured behavioral conflict narrative featuring objective data alignment.',
  ],
  weaknesses: [
    'Failed to detail load balancing algorithms (e.g. Round Robin vs Least Connections).',
    'Lacked specific mention of Python memory differences for lists and tuples.',
    'STAR story could highlight candidate empathy with the counterpart’s perspective.',
  ],
  improvements: [
    'Practice explaining specific routing algorithms when detailing load balancing.',
    'Study memory optimization metrics in Python data structures.',
    'Expand conflict-resolution templates to include proactive empathy markers.',
  ],
  learning_resources: [
    { title: 'System Design Primer', type: 'GitHub', url: 'https://github.com/donnemartin/system-design-primer' },
    { title: 'STAR Interview Method', type: 'Guide', url: 'https://www.indeed.com/career-advice/interviewing/star-method-interview' },
    { title: 'Python Memory Layouts', type: 'Documentation', url: 'https://docs.python.org/3/c-api/memory.html' },
  ],
  roadmap: [
    { day: 1, topic: "Core Architecture Review", activities: ["Review horizontal scaling", "Study database indexing strategies"] },
    { day: 2, topic: "Data Structures & Algorithms", activities: ["Implement Hash Map collision resolutions", "Solve 2 array/string LeetCode questions"] },
    { day: 3, topic: "System Design Decoupling", activities: ["Study Distributed Message Queues (Kafka)", "Design Bit.ly URL shortener"] },
    { day: 4, topic: "API Design Guidelines", activities: ["Learn REST conventions and rate-limiting patterns", "Understand API backward compatibility strategies"] },
    { day: 5, topic: "Cloud & Containerization", activities: ["Write clean Dockerfiles", "Study multi-AZ active failover systems"] },
    { day: 6, topic: "Mock Interview Validation", activities: ["Complete SDE 1 Technical Mock Session"] },
    { day: 7, topic: "Final Knowledge Assessment", activities: ["Take 15-minute quick-fire architecture assessment"] }
  ],
  summary: 'Excellent demo session showing robust core competencies. The candidate presented logical and concise arguments for Python mutable types and system scalability. Minor gaps exist in deeper algorithmic execution detail.',
  transcript: [
    { 
      role: 'ai', 
      text: 'Can you explain the difference between a list and a tuple in Python, and when you would use each?' 
    },
    { 
      role: 'user', 
      text: 'Lists are mutable, meaning we can add, remove, or modify elements after creation. Tuples are immutable, so they cannot be changed once defined. Lists are typically used for homogenous collections of data that change, whereas tuples are used for fixed sequences or as keys in dictionaries.', 
      score: 8.0,
      technical_score: 8.2,
      communication_score: 7.8,
      confidence_score: 8.0,
      feedback: "Great explanation of mutable vs immutable and the practical use cases.",
      strengths: ["Clear mutation definitions", "Gave correct practical mapping examples"],
      weaknesses: ["Could mention memory size differences (tuples are slightly smaller)"],
      improvements: ["Elaborate on performance characteristics"]
    },
    { 
      role: 'ai', 
      text: 'What is a Load Balancer, and why is it important in scaling a web application?' 
    },
    { 
      role: 'user', 
      text: 'A load balancer is a device or software that acts as a reverse proxy to distribute network traffic across multiple servers. It is important because it prevents any single server from becoming a bottleneck, improves availability, and provides redundancy.', 
      score: 7.8,
      technical_score: 7.5,
      communication_score: 8.0,
      confidence_score: 8.0,
      feedback: "Solid system design basics. You correctly explained reverse proxy distribution and availability.",
      strengths: ["Accurate terminology", "Clear explanation of redundancy benefits"],
      weaknesses: ["Did not mention specific algorithms like Round Robin or Least Connections"],
      improvements: ["Provide examples of routing algorithms"]
    },
    { 
      role: 'ai', 
      text: 'Tell me about a time you had a disagreement with a team member. How did you handle it and what was the outcome?' 
    },
    { 
      role: 'user', 
      text: 'We disagreed on database schema design. I set up a meeting to compare both options, discussed trade-offs objectively using benchmark data, and we aligned on a hybrid approach that satisfied both performance and simplicity requirements.', 
      score: 7.5,
      technical_score: 7.2,
      communication_score: 7.8,
      confidence_score: 7.5,
      feedback: "Good response structure, leading with direct conflict resolution steps and dynamic outcomes.",
      strengths: ["STAR structure observed", "Outcome was constructive"],
      weaknesses: ["Lacks details on why the other person disagreed"],
      improvements: ["Elaborate slightly on the counterpart's perspective to show empathy"]
    }
  ],
  questions_count: 3
};

function ScoreRing({ score, size = 100, strokeWidth = 8, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';

  const [currentScore, setCurrentScore] = useState(0);
  useEffect(() => {
    let startTime;
    const duration = 1000;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const easeProgress = percentage * (2 - percentage); // easeOutQuad
      setCurrentScore(Math.floor(easeProgress * score));
      if (progress < duration) {
        window.requestAnimationFrame(step);
      } else {
        setCurrentScore(score);
      }
    };
    window.requestAnimationFrame(step);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#18181B" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
          strokeLinecap="round"
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fill="#FAFAFA" fontSize={size / 4.5} fontWeight="bold" className="font-mono"
          style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}>
          {currentScore}%
        </text>
      </svg>
      {label && <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">{label}</p>}
    </div>
  );
}

function TagList({ items, icon: Icon, color }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <motion.li
          key={i}
          className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Icon size={14} className={`mt-0.5 flex-shrink-0 ${color}`} />
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

export default function ReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { getReport } = useInterview();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replayMode, setReplayMode] = useState('transcript'); // transcript | replay
  const [selectedReplayIdx, setSelectedReplayIdx] = useState(0);

  // Auth Redirect & Fetch
  useEffect(() => {
    if (sessionId.startsWith('demo')) {
      // Bypasses auth completely for demo session
      setReport(MOCK_REPORT);
      setLoading(false);
    } else {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      setLoading(true);
      getReport(sessionId)
        .then((data) => {
          setReport(data || MOCK_REPORT);
        })
        .catch((err) => {
          console.error("Error loading report:", err);
          setReport(MOCK_REPORT);
        })
        .finally(() => setLoading(false));
    }
  }, [sessionId, navigate, getReport]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Generating your report…</p>
        </div>
      </div>
    );
  }

  const r = report || MOCK_REPORT;

  const radarData = [
    { subject: 'Technical', A: r.technical_score },
    { subject: 'Communication', A: r.communication_score },
    { subject: 'Confidence', A: r.confidence_score },
    { subject: 'Problem Solving', A: Math.round((r.technical_score + r.communication_score) / 2) },
  ];

  // Group QA pairs for the Replay Mode
  const pairs = [];
  if (r.transcript) {
    for (let i = 0; i < r.transcript.length; i++) {
      if (r.transcript[i].role === 'ai') {
        const qText = r.transcript[i].text;
        const nextMsg = r.transcript[i + 1];
        if (nextMsg && nextMsg.role === 'user') {
          pairs.push({
            question: qText,
            answer: nextMsg.text,
            score: nextMsg.score,
            technical_score: nextMsg.technical_score || (nextMsg.score ? nextMsg.score : 7.0),
            communication_score: nextMsg.communication_score || (nextMsg.score ? nextMsg.score - 0.5 : 7.0),
            confidence_score: nextMsg.confidence_score || (nextMsg.score ? nextMsg.score + 0.2 : 7.5),
            feedback: nextMsg.feedback || "Good response. Try to cover a bit more depth in structured steps.",
            strengths: nextMsg.strengths || ["Answered the prompt directly"],
            weaknesses: nextMsg.weaknesses || ["Could elaborate on system limits"],
            improvements: nextMsg.improvements || ["Provide concrete technical specifications"]
          });
        } else {
          pairs.push({
            question: qText,
            answer: '',
            score: null,
            strengths: [],
            weaknesses: [],
            improvements: []
          });
        }
      }
    }
  }

  const barData = pairs
    .filter((p) => p.answer && p.score)
    .map((p, i) => ({ 
      name: `Q${i + 1}`, 
      score: Math.round(p.score > 1.0 ? p.score : p.score * 10) 
    }));

  return (
    <motion.div 
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-background text-text-primary pb-16 w-full"
    >
      {/* Header */}
      <div className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
          <ChevronLeft size={16} /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          <span className="font-bold text-sm tracking-tight">Interview Report</span>
          {sessionId.startsWith('demo') && (
            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase rounded-md tracking-wider">Demo Session</span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/interview-setup')}
            className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1.5 font-semibold"
          >
            <Play size={12} /> Practice Again
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Banner */}
        <motion.div
          className="bg-surface border border-border rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreRing score={r.overall_score} size={110} />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-1.5 justify-center md:justify-start mb-1">
                <Award size={16} className="text-warning" />
                <span className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider">Overall Performance</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
                {r.overall_score >= 80 ? 'Excellent Session!' : r.overall_score >= 60 ? 'Good Progress!' : 'Needs Focused Practice'}
              </h1>
              <p className="text-text-secondary text-xs leading-relaxed max-w-xl">{r.summary}</p>
              <div className="flex gap-2 mt-4 flex-wrap justify-center md:justify-start">
                <span className="px-2.5 py-0.5 bg-surface-secondary border border-border rounded-full text-[10px] text-text-secondary font-medium">{r.questions_count || pairs.length} Questions</span>
                <span className="px-2.5 py-0.5 bg-surface-secondary border border-border rounded-full text-[10px] text-text-secondary font-medium">Technical Profile</span>
                <span className="px-2.5 py-0.5 bg-surface-secondary border border-border rounded-full text-[10px] text-text-secondary font-medium">Intermediate</span>
              </div>
            </div>
            {/* Sub-scores */}
            <div className="flex gap-6 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8">
              {[
                { label: 'Technical', score: r.technical_score },
                { label: 'Comm.', score: r.communication_score },
                { label: 'Confidence', score: r.confidence_score },
              ].map((s) => (
                <ScoreRing key={s.label} score={s.score} size={70} strokeWidth={6} label={s.label} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            className="bg-surface border border-border rounded-xl p-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
              <BarChart2 size={14} className="text-primary" /> Score per Question
            </h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={24} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1E" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#111111', border: '1px solid #27272A', borderRadius: 8, color: '#FAFAFA', fontSize: 11 }} />
                  <Bar dataKey="score" fill="#5E6AD2" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className="bg-surface border border-border rounded-xl p-6"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="font-semibold mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
              <Star size={14} className="text-primary" /> Skill Breakdown
            </h3>
            <div className="h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <PolarGrid stroke="#27272A" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Radar name="You" dataKey="A" stroke="#5E6AD2" fill="#5E6AD2" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={true} animationDuration={1200} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Strengths / Weaknesses / Improvements */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Strengths', items: r.strengths, icon: CheckCircle, color: 'text-success', bg: 'bg-surface border border-success/20' },
            { title: 'Weaknesses', items: r.weaknesses, icon: XCircle, color: 'text-danger', bg: 'bg-surface border border-danger/20' },
            { title: 'Action Items', items: r.improvements, icon: TrendingUp, color: 'text-primary', bg: 'bg-surface border border-primary/20' },
          ].map(({ title, items, icon, color, bg }, i) => (
            <motion.div
              key={title}
              className={`rounded-xl p-5 border ${bg}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <h3 className={`font-semibold mb-4 flex items-center gap-2 text-xs uppercase tracking-wider ${color}`}>
                {React.createElement(icon, { size: 14 })} {title}
              </h3>
              <TagList items={items} icon={icon} color={color} />
            </motion.div>
          ))}
        </div>

        {/* Personalized Roadmap */}
        {r.roadmap && r.roadmap.length > 0 && (
          <motion.div
            className="bg-surface border border-border rounded-xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
              <TrendingUp size={14} className="text-primary" /> 7-Day Personalized Study Roadmap
            </h3>
            <div className="relative border-l border-border pl-6 space-y-6 ml-3">
              {r.roadmap.map((day) => (
                <div key={day.day} className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border border-primary bg-background flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase font-mono">Day {day.day}</span>
                    <h4 className="text-sm font-semibold text-text-primary mt-0.5">{day.topic}</h4>
                    <ul className="mt-2 space-y-1">
                      {day.activities?.map((act, aIdx) => (
                        <li key={aIdx} className="text-xs text-text-secondary flex items-start gap-2 leading-relaxed">
                          <span className="text-primary mt-1 flex-shrink-0">•</span>
                          {act}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resources */}
        {r.learning_resources && r.learning_resources.length > 0 && (
          <motion.div
            className="bg-surface border border-border rounded-xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
              <Lightbulb size={14} className="text-warning" /> Recommended Resources
            </h3>
            <div className="flex gap-3 flex-wrap">
              {r.learning_resources.map((res, i) => (
                <a
                  key={i}
                  href={res.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 bg-surface-secondary border border-border rounded-lg text-xs hover:border-primary/50 hover:bg-primary/5 transition-all text-text-primary font-medium"
                >
                  <BookOpen size={13} className="text-primary" />
                  <span>{res.title}</span>
                  <span className="text-[10px] text-text-muted font-normal">({res.type})</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transcript / Replay Mode */}
        <motion.div
          className="bg-surface border border-border rounded-xl p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-5 border-b border-border pb-4 flex-wrap gap-3">
            <h3 className="font-semibold flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
              <Brain size={14} className="text-primary" /> Interview Replay & Transcript
            </h3>
            
            <div className="bg-surface-secondary border border-border p-0.5 rounded-lg flex gap-1">
              <button
                type="button"
                onClick={() => setReplayMode('transcript')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  replayMode === 'transcript'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Simple Transcript
              </button>
              <button
                type="button"
                onClick={() => setReplayMode('replay')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  replayMode === 'replay'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Question Replay Analysis
              </button>
            </div>
          </div>

          {replayMode === 'transcript' ? (
            <motion.div 
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {r.transcript.map((msg, i) => (
                <motion.div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
                  }}
                >
                  <div className={`max-w-2xl px-4 py-3.5 rounded-xl text-xs leading-relaxed border ${
                    msg.role === 'ai'
                      ? 'bg-surface-secondary border-border text-text-primary rounded-tl-none'
                      : 'bg-primary/5 border-primary/20 text-text-primary rounded-tr-none'
                  }`}>
                    <p className={`font-mono text-[9px] uppercase tracking-wider mb-1.5 ${msg.role === 'ai' ? 'text-primary' : 'text-success'}`}>
                      {msg.role === 'ai' ? '🤖 AI Interviewer' : '👤 Candidate Response'}
                      {msg.score && <span className="ml-2 font-bold font-mono">· {Math.round(msg.score > 1.0 ? msg.score : msg.score * 10)}/10</span>}
                    </p>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            pairs.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">No answered questions to display.</p>
            ) : (
              <div className="grid md:grid-cols-4 gap-6 items-start">
                {/* Question selector */}
                <motion.div 
                  className="space-y-1.5 md:col-span-1 flex flex-col"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {pairs.map((p, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedReplayIdx(idx)}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
                      }}
                      className={`w-full text-left p-3 rounded-lg border text-xs font-semibold transition-all ${
                        selectedReplayIdx === idx
                          ? 'bg-surface-secondary border-primary text-text-primary shadow-sm'
                          : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40'
                      }`}
                    >
                      Question {idx + 1}
                      <span className="block text-[10px] text-text-muted font-normal truncate mt-0.5">{p.question}</span>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Question Details Viewport */}
                <div className="md:col-span-3 bg-surface-secondary/40 border border-border rounded-xl p-5 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-primary uppercase font-mono block">Question {selectedReplayIdx + 1}</span>
                    <p className="text-xs font-semibold text-text-primary mt-1 italic">"{pairs[selectedReplayIdx].question}"</p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <span className="text-[9px] font-bold text-success uppercase font-mono block">Candidate Answer</span>
                    <p className="text-xs text-text-secondary leading-relaxed mt-1.5 whitespace-pre-wrap">
                      {pairs[selectedReplayIdx].answer || <em className="text-text-muted">No response recorded</em>}
                    </p>
                  </div>

                  {pairs[selectedReplayIdx].answer && (
                    <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div className="sm:col-span-1 flex gap-4 justify-around border-r border-border/50 pr-4">
                        <div className="text-center">
                          <span className="text-sm font-mono font-bold text-primary block">
                            {pairs[selectedReplayIdx].technical_score ? `${Math.round(pairs[selectedReplayIdx].technical_score * 10)}%` : '—'}
                          </span>
                          <span className="text-[9px] text-text-muted block uppercase mt-0.5">Tech</span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-mono font-bold text-success block">
                            {pairs[selectedReplayIdx].communication_score ? `${Math.round(pairs[selectedReplayIdx].communication_score * 10)}%` : '—'}
                          </span>
                          <span className="text-[9px] text-text-muted block uppercase mt-0.5">Comm</span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-mono font-bold text-warning block">
                            {pairs[selectedReplayIdx].confidence_score ? `${Math.round(pairs[selectedReplayIdx].confidence_score * 10)}%` : '—'}
                          </span>
                          <span className="text-[9px] text-text-muted block uppercase mt-0.5">Conf</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 text-xs">
                        <span className="text-[9px] font-bold text-text-secondary uppercase font-mono block">AI Feedback</span>
                        <p className="text-text-secondary leading-relaxed mt-1">{pairs[selectedReplayIdx].feedback}</p>
                      </div>
                    </div>
                  )}

                  {pairs[selectedReplayIdx].answer && (pairs[selectedReplayIdx].strengths?.length > 0 || pairs[selectedReplayIdx].weaknesses?.length > 0) && (
                    <div className="border-t border-border pt-4 grid sm:grid-cols-2 gap-4">
                      {pairs[selectedReplayIdx].strengths?.length > 0 && (
                        <div className="bg-surface/50 border border-success/15 rounded-lg p-3">
                          <span className="text-[9px] font-bold text-success uppercase font-mono block mb-2">Strengths</span>
                          <ul className="space-y-1">
                            {pairs[selectedReplayIdx].strengths.map((str, sIdx) => (
                              <li key={sIdx} className="text-[11px] text-text-secondary flex items-start gap-1.5 leading-normal">
                                <span className="text-success mt-0.5 font-bold">✓</span>
                                {str}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {pairs[selectedReplayIdx].weaknesses?.length > 0 && (
                        <div className="bg-surface/50 border border-danger/15 rounded-lg p-3">
                          <span className="text-[9px] font-bold text-danger uppercase font-mono block mb-2">Weaknesses</span>
                          <ul className="space-y-1">
                            {pairs[selectedReplayIdx].weaknesses.map((weak, wIdx) => (
                              <li key={wIdx} className="text-[11px] text-text-secondary flex items-start gap-1.5 leading-normal">
                                <span className="text-danger mt-0.5 font-bold">✗</span>
                                {weak}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </motion.div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            to="/interview-setup"
            className="btn-primary py-3 px-8 text-xs font-semibold inline-flex items-center gap-2"
          >
            <Play size={14} /> Start Another Interview
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
