import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Play, BarChart2, User, LogOut, Brain,
  Clock, Search, Filter, SlidersHorizontal, ChevronRight, Award, Trash2
} from 'lucide-react';
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

export default function HistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getProfile } = useAuth();
  const { getSessions } = useInterview();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // all | technical | hr | behavioral | system_design
  const [selectedDifficulty, setSelectedDifficulty] = useState('all'); // all | beginner | intermediate | advanced | fresher | sde_1 | sde_2
  
  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
    
    setLoading(true);
    getSessions()
      .then((data) => {
        if (Array.isArray(data)) {
          setSessions(data);
        } else if (data?.sessions) {
          setSessions(data.sessions);
        }
      })
      .catch((err) => {
        console.error("Failed to load history sessions:", err);
      })
      .finally(() => setLoading(false));
  }, [getSessions, getProfile]);

  const displayName = profile?.full_name || user?.full_name || 'Interviewer';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.job_role?.replace(/_/g, ' ').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.interview_type?.replace(/_/g, ' ').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || s.interview_type === selectedType;
    
    const matchesDiff = selectedDifficulty === 'all' || s.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesType && matchesDiff;
  });

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
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Interview History</h1>
            <p className="text-text-secondary mt-1 text-sm">Browse, search, and replay your past interview attempts.</p>
          </div>
          <Link
            to="/interview-setup"
            className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            <Play size={13} />
            Start New Session
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search role or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 py-1.5 text-xs"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto flex-wrap justify-end">
            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-surface-secondary border border-border rounded-lg px-3 py-1.5">
              <Filter size={12} className="text-text-muted" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent border-0 text-text-secondary text-xs focus:ring-0 p-0 pr-6 font-semibold"
              >
                <option value="all">All Profiles</option>
                <option value="technical">Technical</option>
                <option value="hr">HR Interview</option>
                <option value="behavioral">Behavioral</option>
                <option value="system_design">System Design</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2 bg-surface-secondary border border-border rounded-lg px-3 py-1.5">
              <SlidersHorizontal size={12} className="text-text-muted" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-transparent border-0 text-text-secondary text-xs focus:ring-0 p-0 pr-6 font-semibold"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="fresher">Fresher</option>
                <option value="sde_1">SDE 1</option>
                <option value="sde_2">SDE 2</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 border border-border rounded-xl bg-surface-secondary skeleton" />
                  <div className="space-y-2 flex-1 max-w-sm">
                    <div className="h-4 bg-surface-secondary rounded skeleton w-2/3" />
                    <div className="h-3 bg-surface-secondary rounded skeleton w-1/3" />
                  </div>
                </div>
                <div className="w-16 h-6 bg-surface-secondary rounded skeleton" />
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <Award size={36} className="mx-auto mb-3 opacity-20 text-text-secondary" />
            <h3 className="font-bold text-sm text-text-primary">No sessions found</h3>
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
              {sessions.length === 0 
                ? "You haven't practiced any interviews yet. Complete your first session to view records!" 
                : "No interviews match the selected query and filters."}
            </p>
            {sessions.length === 0 && (
              <Link
                to="/interview-setup"
                className="btn-primary mt-6 py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Play size={13} />
                Practice Now
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((s) => {
              const isCompleted = s.status === 'completed';
              return (
                <div
                  key={s.session_id || s._id}
                  className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:border-text-muted/40 transition-all cursor-pointer group"
                  onClick={() => navigate(isCompleted ? `/report/${s.session_id || s._id}` : `/interview/${s.session_id || s._id}`)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 border border-border rounded-xl flex items-center justify-center ${isCompleted ? 'text-primary bg-primary/5' : 'text-warning bg-warning/5 animate-pulse'}`}>
                      <Brain size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold capitalize text-text-primary truncate">
                        {s.interview_type?.replace('_', ' ')} — {s.job_role?.replace(/_/g, ' ')}
                      </p>
                      <div className="flex gap-2.5 items-center mt-1 text-[10px] text-text-secondary flex-wrap capitalize">
                        <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border">{s.difficulty}</span>
                        <span>·</span>
                        <span>{s.created_at?.slice(0, 10) || 'Date Unknown'}</span>
                        <span>·</span>
                        <span className={isCompleted ? 'text-text-muted font-normal' : 'text-warning font-bold'}>
                          {isCompleted ? 'Completed' : 'Active Room'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isCompleted ? (
                      <ScoreBadge score={s.overall_score} />
                    ) : (
                      <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full font-bold">Resume Call</span>
                    )}
                    <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </motion.div>
  );
}
