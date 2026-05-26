import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, TrendingUp, AlertTriangle, BookOpen, ChevronLeft,
  Download, Play, Brain, Star, CheckCircle, XCircle, Lightbulb, BarChart2
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useInterview } from '../context/InterviewContext';

// Mock report for demo
const MOCK_REPORT = {
  overall_score: 74,
  technical_score: 78,
  communication_score: 80,
  confidence_score: 65,
  strengths: [
    'Strong understanding of core programming concepts',
    'Clear and articulate communication style',
    'Good problem decomposition skills',
  ],
  weaknesses: [
    'Limited experience with system design at scale',
    'Could provide more concrete real-world examples',
    'Occasional filler words reduce confidence impact',
  ],
  improvements: [
    'Practice designing distributed systems using online courses',
    'Prepare 5–6 STAR stories for behavioral questions',
    'Record yourself answering questions to identify filler words',
    'Review database indexing and query optimization',
  ],
  learning_resources: [
    { title: 'System Design Primer', type: 'GitHub', url: 'https://github.com/donnemartin/system-design-primer' },
    { title: 'Cracking the Coding Interview', type: 'Book' },
    { title: 'Grokking the System Design Interview', type: 'Course' },
  ],
  summary: 'Overall solid performance with strong communication skills and foundational technical knowledge. Focus on system design depth and specific examples to reach the next level.',
  transcript: [
    { role: 'ai', text: 'Tell me about yourself and your background in software development.' },
    { role: 'user', text: 'I have 2 years of experience in backend development, primarily using Python and FastAPI. I have worked on REST APIs, database design, and recently started exploring cloud services.', score: 7.8 },
    { role: 'ai', text: 'Describe a challenging technical problem you solved recently. What was your approach?' },
    { role: 'user', text: 'We had a performance issue with our API that was returning 10,000 records per request. I implemented pagination, added database indices, and introduced caching using Redis, which reduced response time by 80%.', score: 8.5 },
    { role: 'ai', text: 'How do you handle tight deadlines and prioritise tasks?' },
    { role: 'user', text: 'I use a priority matrix to categorize tasks by urgency and importance. I communicate early with stakeholders when scope needs to be adjusted and always tackle the highest-risk items first.', score: 7.2 },
  ],
  questions_count: 5,
};

function ScoreRing({ score, size = 100, strokeWidth = 8, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize={size / 4.5} fontWeight="bold"
          style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}>
          {score}%
        </text>
      </svg>
      {label && <p className="text-xs text-slate-400">{label}</p>}
    </div>
  );
}

function TagList({ items, icon: Icon, color }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <motion.li
          key={i}
          className="flex items-start gap-2.5 text-sm text-slate-300"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Icon size={15} className={`mt-0.5 flex-shrink-0 ${color}`} />
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

  useEffect(() => {
    setLoading(true);
    getReport(sessionId)
      .then((data) => setReport(data || MOCK_REPORT))
      .catch(() => setReport(MOCK_REPORT))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-slate-400">Generating your report…</p>
        </motion.div>
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

  const barData = r.transcript
    .filter((m) => m.role === 'user' && m.score)
    .map((m, i) => ({ name: `Q${i + 1}`, score: Math.round(m.score * 10) }));

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ChevronLeft size={16} /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-blue-400" />
          <span className="font-semibold text-sm">Interview Report</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/interview-setup')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
          >
            <Play size={12} /> Practice Again
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium border border-slate-600 text-slate-400 rounded-lg hover:border-slate-400 hover:text-white transition-all">
            <Download size={12} /> Export PDF
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Banner */}
        <motion.div
          className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/30 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ScoreRing score={r.overall_score} size={110} />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <Award size={18} className="text-yellow-400" />
                <span className="text-sm text-slate-400 font-medium">Overall Performance</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {r.overall_score >= 80 ? '🎉 Excellent!' : r.overall_score >= 60 ? '👍 Good Job!' : '📈 Keep Practicing!'}
              </h1>
              <p className="text-slate-300 text-sm max-w-xl">{r.summary}</p>
              <div className="flex gap-2 mt-3 flex-wrap justify-center md:justify-start">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-xs text-blue-300 font-medium">{r.questions_count} Questions</span>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs text-purple-300 font-medium">Technical Interview</span>
                <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300 font-medium">Intermediate</span>
              </div>
            </div>
            {/* Sub-scores */}
            <div className="flex gap-5">
              {[
                { label: 'Technical', score: r.technical_score },
                { label: 'Communication', score: r.communication_score },
                { label: 'Confidence', score: r.confidence_score },
              ].map((s) => (
                <ScoreRing key={s.label} score={s.score} size={80} strokeWidth={7} label={s.label} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm"><BarChart2 size={15} className="text-blue-400" />Score per Question</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="score" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm"><Star size={15} className="text-purple-400" />Skill Breakdown</h3>
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="You" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Strengths / Weaknesses / Improvements */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Strengths', items: r.strengths, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/5 border-green-500/20' },
            { title: 'Weaknesses', items: r.weaknesses, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
            { title: 'Action Items', items: r.improvements, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20' },
          ].map(({ title, items, icon, color, bg }, i) => (
            <motion.div
              key={title}
              className={`rounded-xl p-5 border ${bg}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm ${color}`}>
                {React.createElement(icon, { size: 15 })} {title}
              </h3>
              <TagList items={items} icon={icon} color={color} />
            </motion.div>
          ))}
        </div>

        {/* Resources */}
        {r.learning_resources?.length > 0 && (
          <motion.div
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <Lightbulb size={15} className="text-yellow-400" /> Recommended Learning Resources
            </h3>
            <div className="flex gap-3 flex-wrap">
              {r.learning_resources.map((res, i) => (
                <a
                  key={i}
                  href={res.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm hover:border-blue-500/50 hover:bg-blue-500/10 transition-all"
                >
                  <BookOpen size={13} className="text-blue-400" />
                  <span>{res.title}</span>
                  <span className="text-xs text-slate-500">{res.type}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transcript */}
        <motion.div
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold mb-5 flex items-center gap-2 text-sm">
            <Brain size={15} className="text-blue-400" /> Interview Transcript
          </h3>
          <div className="space-y-4">
            {r.transcript.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-slate-900 border border-slate-700 text-slate-200 rounded-tl-sm'
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 text-slate-200 rounded-tr-sm'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${msg.role === 'ai' ? 'text-blue-400' : 'text-purple-400'}`}>
                    {msg.role === 'ai' ? '🤖 AI Interviewer' : '👤 You'}
                    {msg.score && <span className="ml-2 text-green-400">· {Math.round(msg.score * 10)}/10</span>}
                  </p>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/interview-setup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/40 transition-all text-sm"
          >
            <Play size={16} /> Start Another Interview
          </Link>
        </div>
      </div>
    </div>
  );
}
