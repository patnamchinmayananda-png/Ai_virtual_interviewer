import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Play, BarChart2, User, LogOut, Brain,
  TrendingUp, Clock, Award, ChevronRight, Zap, Target, BookOpen, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';

const SIDEBAR_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Play, label: 'New Interview', to: '/interview-setup' },
  { icon: Clock, label: 'History', to: '/history' },
  { icon: BarChart2, label: 'Resume Analyzer', to: '/resume-analyzer' },
  { icon: User, label: 'Profile', to: '/profile' },
];

function ScoreBadge({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 80 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-danger';
  return <span className={`font-mono font-bold text-sm ${color}`}>{pct}%</span>;
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex gap-4 items-center hover:border-text-muted/40 transition-all duration-200">
      <div className="w-10 h-10 rounded-lg border border-border bg-surface-secondary flex items-center justify-center text-text-secondary">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-text-secondary text-xs font-medium">{label}</p>
        <p className="text-2xl font-bold text-text-primary tracking-tight mt-0.5">{value}</p>
        {sub && <p className="text-text-muted text-[10px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StreakCounter({ value }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    const duration = 500;
    const endVal = parseInt(value, 10);
    if (isNaN(endVal)) return;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      setCount(Math.floor(percentage * endVal));
      if (progress < duration) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endVal);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return (
    <motion.span
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-xs font-mono font-bold text-primary"
    >
      {count} Days 🔥
    </motion.span>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getProfile } = useAuth();
  const { getSessions, getAnalytics } = useInterview();
  
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
    
    setLoading(true);
    Promise.all([
      getSessions().then((data) => {
        if (Array.isArray(data)) {
          setSessions(data);
        } else if (data?.sessions) {
          setSessions(data.sessions);
        }
      }),
      getAnalytics().then((data) => {
        if (data) setAnalytics(data);
      })
    ]).catch((err) => {
      console.error("Error loading dashboard data:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, [getSessions, getAnalytics, getProfile]);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!loading && analytics?.badges && analytics.badges.length > 0) {
      const timer = setTimeout(() => {
        setToast({
          title: "Achievement Unlocked",
          desc: analytics.badges[0].name || "Communication Expert"
        });
        
        setTimeout(() => {
          setToast(null);
        }, 3000);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, analytics]);

  const displayName = profile?.full_name || user?.full_name || 'Interviewer';
  
  const avgScore = analytics
    ? Math.round(analytics.average_score)
    : (sessions.length
        ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0) * 100, 0) / sessions.length)
        : 0);

  const totalPracticeMinutes = analytics
    ? analytics.total_practice_minutes
    : sessions.length * 25;

  const trendData = analytics?.score_trend?.length 
    ? analytics.score_trend 
    : [
        { date: 'Jun 1', score: 60 },
        { date: 'Jun 3', score: 68 },
        { date: 'Jun 5', score: 75 }
      ];

  const radarData = analytics?.skill_radar?.length
    ? analytics.skill_radar
    : [
        { subject: 'Technical', A: 0 },
        { subject: 'Communication', A: 0 },
        { subject: 'Confidence', A: 0 },
        { subject: 'Problem Solving', A: 0 },
        { subject: 'Leadership', A: 0 },
      ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-background text-text-primary flex w-full"
    >
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col py-6 px-4 fixed h-full z-20">
        <Link to="/" className="flex items-center gap-2.5 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg border border-border bg-surface-secondary flex items-center justify-center text-primary">
            <Brain size={18} />
          </div>
          <span className="text-base font-bold text-text-primary tracking-tight">
            InterviewAI
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {SIDEBAR_LINKS.map(({ icon: Icon, label, to }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium border ${
                  isActive
                    ? 'border-border text-text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeHighlight"
                    className="absolute inset-0 bg-surface-secondary rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-3 mb-4">
            <div className="w-8 h-8 bg-surface-secondary border border-border rounded-full flex items-center justify-center text-sm font-bold text-text-primary font-mono">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
              <p className="text-xs text-text-muted truncate">{profile?.email || user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 text-text-secondary hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg transition-all w-full text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Welcome back, <span className="text-primary font-semibold">{displayName.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-text-secondary mt-1 text-sm">Track your progress and keep practicing to land your dream job.</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Stats skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-5 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg border border-border bg-surface-secondary skeleton" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-16 bg-surface-secondary rounded skeleton" />
                    <div className="h-6 w-24 bg-surface-secondary rounded skeleton" />
                  </div>
                </div>
              ))}
            </div>
            {/* Charts skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 h-[280px] flex flex-col justify-between">
                <div className="h-4 w-32 bg-surface-secondary rounded skeleton" />
                <div className="h-44 w-full bg-surface-secondary/40 rounded skeleton" />
              </div>
              <div className="bg-surface border border-border rounded-xl p-6 h-[280px] flex flex-col justify-between">
                <div className="h-4 w-24 bg-surface-secondary rounded skeleton" />
                <div className="h-44 w-full bg-surface-secondary/40 rounded skeleton" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Play, label: 'Interviews Done', value: sessions.length, sub: 'Total sessions' },
                { icon: Award, label: 'Avg. Score', value: `${avgScore}%`, sub: 'Across all interviews' },
                { icon: TrendingUp, label: 'Improvement', value: sessions.length > 1 ? '+12%' : '—', sub: 'Monthly delta' },
                { icon: Clock, label: 'Time Practiced', value: `${totalPracticeMinutes}m`, sub: 'Total minutes' },
              ].map((s, i) => (
                <StatCard key={i} {...s} />
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Score Trend */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold mb-6 flex items-center gap-2 text-text-primary">
                  <TrendingUp size={16} className="text-primary" /> Score Trend
                </h2>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1E" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 100]} />
                      <Tooltip
                        contentStyle={{ background: '#111111', border: '1px solid #27272A', borderRadius: 8, color: '#FAFAFA', fontSize: 11 }}
                        cursor={{ stroke: '#27272A', strokeWidth: 1 }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#5E6AD2" strokeWidth={2} dot={{ fill: '#5E6AD2', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold mb-6 flex items-center gap-2 text-text-primary">
                  <Target size={16} className="text-primary" /> Skill Radar
                </h2>
                <div className="h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                      <PolarGrid stroke="#27272A" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#A1A1AA', fontSize: 9 }} />
                      <Radar name="Skills" dataKey="A" stroke="#5E6AD2" fill="#5E6AD2" fillOpacity={0.15} strokeWidth={1.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Sessions */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-sm font-semibold text-text-primary">Recent Interviews</h2>
                  <Link to="/history" className="text-primary hover:text-primary-hover text-xs font-semibold flex items-center gap-0.5">
                    View All History <ChevronRight size={14} />
                  </Link>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-10 text-text-muted">
                    <Play size={28} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No interviews yet. Start your first one!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sessions.slice(0, 5).map((s) => (
                      <div
                        key={s.session_id}
                        className="flex items-center justify-between p-3.5 bg-surface-secondary rounded-lg border border-border hover:border-text-muted/40 transition-all cursor-pointer group"
                        onClick={() => navigate(s.status === 'completed' ? `/report/${s.session_id}` : `/interview/${s.session_id}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-border ${s.status === 'completed' ? 'text-primary bg-surface' : 'text-warning bg-surface animate-pulse'}`}>
                            <Brain size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium capitalize text-text-primary truncate">
                              {s.interview_type?.replace('_', ' ')} — {s.job_role?.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[10px] text-text-muted capitalize mt-0.5">{s.difficulty} · {s.created_at?.slice(0, 10)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {s.status === 'completed' ? (
                            <ScoreBadge score={s.overall_score} />
                          ) : (
                            <span className="text-[9px] text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full font-bold">In Room</span>
                          )}
                          <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions / Streaks Column */}
              <div className="space-y-6">
                {/* Streak Widget */}
                <div className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-primary fill-primary/10" />
                      <span className="text-sm font-semibold text-text-primary">Practice Streak</span>
                    </div>
                    <StreakCounter value={analytics?.practice_streak || 0} />
                  </div>
                  <p className="text-xs text-text-secondary mb-4">Keep practicing daily to build muscle memory.</p>
                  <div className="flex justify-between items-center gap-1.5 mb-5">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                      const streakVal = analytics?.practice_streak || 0;
                      const isActive = streakVal > 0 && idx < (streakVal % 7 === 0 ? 7 : streakVal % 7);
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border transition-all ${
                              isActive
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-surface-secondary border-border text-text-muted'
                            }`}
                          >
                            {day}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weekly Goal Progress */}
                  <div className="border-t border-border/50 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Weekly Goal Progress</span>
                      <span className="text-xs font-mono font-bold text-primary">
                        {analytics?.practice_streak ? Math.min(Math.round((analytics.practice_streak / 5) * 100), 100) : 60}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-secondary border border-border h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${analytics?.practice_streak ? Math.min((analytics.practice_streak / 5) * 100, 100) : 60}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-[9px] text-text-muted mt-2">Goal: Practice at least 5 days a week.</p>
                  </div>
                </div>

                {/* Earned Badges Widget */}
                {analytics?.badges && analytics.badges.length > 0 && (
                  <div className="bg-surface border border-border rounded-xl p-5">
                    <h3 className="font-semibold mb-3.5 flex items-center gap-2 text-sm text-text-primary">
                      <Award size={15} className="text-warning" /> Earned Badges
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {analytics.badges.map((badge) => {
                        const badgeName = badge.name;
                        const badgeDesc = badge.description;
                        return (
                          <div 
                            key={badge.id} 
                            className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-secondary border border-border hover:border-primary/30 transition-all text-center group relative cursor-help"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
                              <Award size={14} />
                            </div>
                            <span className="text-[8px] text-text-secondary truncate w-full font-bold">{badgeName}</span>
                            
                            {/* Hover Details Card */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-surface border border-border rounded-md text-[10px] text-text-secondary leading-normal shadow-lg z-30">
                              <strong className="text-text-primary block mb-0.5">{badgeName}</strong>
                              {badgeDesc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommended Topics */}
                <div className="bg-surface border border-border rounded-xl p-5">
                  <h3 className="font-semibold mb-3.5 flex items-center gap-2 text-sm text-text-primary">
                    <BookOpen size={15} className="text-primary" /> Recommended Topics
                  </h3>
                  <div className="space-y-2">
                    {(analytics?.recommended_topics || ['Core Technical Interview', 'System Design Basics', 'Behavioral STAR Method']).map((topic) => (
                      <div key={topic} className="text-xs text-text-secondary flex items-center gap-2 p-1.5 rounded bg-surface-secondary/50 border border-border/50">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-6 right-6 z-50 bg-surface border border-primary/30 p-4 rounded-xl shadow-[0_10px_30px_rgb(0,0,0,0.5)] flex items-center gap-3.5 max-w-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Award size={18} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Achievement Unlocked</span>
              <span className="text-xs font-semibold text-text-primary block mt-0.5">{toast.desc}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
