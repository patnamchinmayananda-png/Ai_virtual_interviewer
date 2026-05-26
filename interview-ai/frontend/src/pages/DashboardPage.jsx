import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Play, BarChart2, User, LogOut, Brain,
  TrendingUp, Clock, Award, ChevronRight, Zap, Target, BookOpen
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';

const MOCK_SESSIONS = [
  { session_id: 's1', interview_type: 'technical', job_role: 'backend_developer', difficulty: 'intermediate', status: 'completed', overall_score: 0.78, created_at: '2024-06-01' },
  { session_id: 's2', interview_type: 'hr', job_role: 'software_engineer', difficulty: 'beginner', status: 'completed', overall_score: 0.85, created_at: '2024-06-03' },
  { session_id: 's3', interview_type: 'behavioral', job_role: 'frontend_developer', difficulty: 'intermediate', status: 'completed', overall_score: 0.70, created_at: '2024-06-05' },
  { session_id: 's4', interview_type: 'technical', job_role: 'ai_engineer', difficulty: 'advanced', status: 'completed', overall_score: 0.62, created_at: '2024-06-08' },
];

const MOCK_TREND = [
  { date: 'May 20', score: 60 },
  { date: 'May 25', score: 65 },
  { date: 'Jun 1', score: 70 },
  { date: 'Jun 5', score: 68 },
  { date: 'Jun 8', score: 75 },
  { date: 'Jun 12', score: 80 },
];

const MOCK_RADAR = [
  { subject: 'Technical', A: 78 },
  { subject: 'Communication', A: 85 },
  { subject: 'Confidence', A: 70 },
  { subject: 'Problem Solving', A: 72 },
  { subject: 'Leadership', A: 65 },
];

const SIDEBAR_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Play, label: 'New Interview', to: '/interview-setup' },
  { icon: BarChart2, label: 'Resume Analyzer', to: '/resume-analyzer' },
  { icon: User, label: 'Profile', to: '/profile' },
];

function ScoreBadge({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-bold ${color}`}>{pct}%</span>;
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex gap-4 items-center"
      whileHover={{ y: -2 }}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-slate-500 text-xs">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, getProfile } = useAuth();
  const { getSessions } = useInterview();
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
    getSessions().then((data) => {
      if (data?.sessions?.length) setSessions(data.sessions);
    }).catch(() => {});
  }, []);

  const displayName = profile?.full_name || user?.full_name || 'Interviewer';
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0) * 100, 0) / sessions.length)
    : 0;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col py-6 px-4 fixed h-full z-20">
        <Link to="/" className="flex items-center gap-2 mb-10 px-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain size={20} />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            InterviewAI
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {SIDEBAR_LINKS.map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              {displayName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.email || user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all w-full text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{displayName.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Track your progress and keep practicing to land your dream job.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Play, label: 'Interviews Done', value: sessions.length, color: 'bg-blue-500/20', sub: 'Total sessions' },
            { icon: Award, label: 'Avg. Score', value: `${avgScore}%`, color: 'bg-purple-500/20', sub: 'Across all interviews' },
            { icon: TrendingUp, label: 'Improvement', value: '+12%', color: 'bg-green-500/20', sub: 'This month' },
            { icon: Clock, label: 'Time Practiced', value: `${sessions.length * 25}m`, color: 'bg-orange-500/20', sub: 'Total minutes' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Score Trend */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400" /> Score Trend
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={MOCK_TREND}>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[40, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Target size={16} className="text-purple-400" /> Skill Radar
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={MOCK_RADAR}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Skills" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sessions + Quick Start */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Sessions */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold">Recent Interviews</h2>
              <Link to="/interview-setup" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                Start New <ChevronRight size={14} />
              </Link>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Play size={32} className="mx-auto mb-3 opacity-30" />
                <p>No interviews yet. Start your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((s, i) => (
                  <motion.div
                    key={s.id || s._id || s.session_id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer group"
                    whileHover={{ x: 3 }}
                    onClick={() => navigate(`/report/${s.id || s._id || s.session_id}`)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                        <Brain size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {s.interview_type?.replace('_', ' ')} — {s.job_role?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{s.difficulty} · {s.created_at?.slice(0, 10)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={s.overall_score} />
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            {/* Start Interview CTA */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/40 rounded-xl p-6">
              <Zap size={24} className="text-blue-400 mb-3" />
              <h3 className="font-semibold mb-1">Ready to Practice?</h3>
              <p className="text-slate-400 text-sm mb-4">Start a new AI-powered mock interview.</p>
              <Link
                to="/interview-setup"
                className="block w-full py-2.5 text-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Start Interview
              </Link>
            </div>

            {/* Recommended Topics */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <BookOpen size={15} className="text-purple-400" /> Recommended Topics
              </h3>
              <ul className="space-y-2">
                {['System Design Basics', 'Behavioral STAR Method', 'Data Structures', 'API Design'].map((topic) => (
                  <li key={topic} className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
