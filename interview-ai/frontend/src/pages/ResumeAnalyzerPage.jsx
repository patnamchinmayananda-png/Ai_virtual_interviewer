import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, CheckCircle2, AlertTriangle, TrendingUp, RefreshCw, Target,
  ChevronRight, Brain, Briefcase, Wrench, BarChart2, ShieldAlert, Sparkles,
  LayoutDashboard, Play, User, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';

const SIDEBAR_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Play, label: 'New Interview', to: '/interview-setup' },
  { icon: BarChart2, label: 'Resume Analyzer', to: '/resume-analyzer' },
  { icon: User, label: 'Profile', to: '/profile' },
];

export default function ResumeAnalyzerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getProfile } = useAuth();
  const { analyzeResume } = useInterview();
  const [profile, setProfile] = useState(null);

  // File Upload states
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // text | scan | compat
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  React.useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
  }, []);

  const displayName = profile?.full_name || user?.full_name || 'Interviewer';
  const handleLogout = () => { logout(); navigate('/'); };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileProcessing(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcessing(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileProcessing = async (selectedFile) => {
    const validExtensions = ['pdf', 'txt'];
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError("Unsupported file format. Please upload a PDF or TXT file.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploading(true);
    setAnalysisResult(null);

    // Dynamic visual upload progress logs to look premium
    setUploadStage('1/3 Extracting raw text layers...');
    setUploadProgress(15);
    
    const progressIntervals = [
      { p: 35, s: '2/3 Analysing semantic skills and structures...', d: 700 },
      { p: 65, s: '3/3 Cross-referencing ATS job compatibility matrices...', d: 1300 },
      { p: 90, s: 'Synthesizing comprehensive score analytics...', d: 1900 }
    ];

    progressIntervals.forEach((step) => {
      setTimeout(() => {
        setUploadProgress(step.p);
        setUploadStage(step.s);
      }, step.d);
    });

    try {
      const result = await analyzeResume(selectedFile);
      
      // Delay final loading state to complete step-by-step animation gracefully
      setTimeout(() => {
        setUploadProgress(100);
        setAnalysisResult(result);
        setUploading(false);
      }, 2500);

    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError(err.response?.data?.detail || "Failed to analyze resume. Please make sure the PDF has extractable text layers.");
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium border ${
                  isActive
                    ? 'bg-surface-secondary border-border text-text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50'
                }`}
              >
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
        
        {/* Header HUD */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <Sparkles className="text-primary" size={24} /> Resume Analyzer
            </h1>
            <p className="text-text-secondary mt-1 text-sm">Upload your resume to perform instant ATS grading, skill categorisation, and career alignment checking.</p>
          </div>

          {analysisResult && (
            <button
              onClick={clearFile}
              className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 font-semibold"
            >
              <RefreshCw size={13} /> Analyze New Resume
            </button>
          )}
        </div>

        {/* Dynamic state container */}
        <AnimatePresence mode="wait">
          
          {/* STATE 1: Dropzone Upload Form */}
          {!file && !analysisResult && (
            <motion.div
              key="dropzone"
              className="w-full max-w-xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div
                className={`border border-dashed rounded-xl p-10 text-center cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-surface hover:border-text-muted/40 hover:bg-surface-secondary/20'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.txt"
                />

                <div className="w-12 h-12 rounded-xl border border-border bg-surface-secondary flex items-center justify-center mb-5 text-primary animate-float">
                  <FileText size={22} />
                </div>

                <h3 className="text-base font-semibold text-text-primary mb-1">Drag and drop your resume</h3>
                <p className="text-text-secondary text-xs mb-6 max-w-sm leading-relaxed">
                  Supported formats: <strong className="text-text-primary font-medium">PDF</strong> or <strong className="text-text-primary font-medium">TXT</strong>. Ensure the file contains vector text layers (not a scanned image).
                </p>

                <button
                  type="button"
                  className="btn-primary py-2.5 px-6 text-xs font-semibold"
                >
                  Browse Files
                </button>

                {error && (
                  <motion.div
                    className="mt-6 flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/25 px-4 py-2.5 rounded-lg max-w-md text-left"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <ShieldAlert size={14} className="flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STATE 2: Loader & Analyzer stages */}
          {uploading && (
            <motion.div
              key="loader"
              className="w-full max-w-md mx-auto py-16 flex flex-col items-center justify-center text-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-12 h-12 rounded-full border-2 border-border border-t-primary animate-spin mb-6" />

              <h3 className="text-sm font-semibold text-text-primary mb-1">Analyzing Resume</h3>
              <p className="text-xs text-primary font-mono tracking-wider uppercase mb-5">
                {uploadStage}
              </p>

              <div className="w-full bg-surface border border-border h-2 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[10px] text-text-muted font-semibold font-mono">{uploadProgress}% complete</span>
            </motion.div>
          )}

          {/* STATE 4: Error State View */}
          {file && error && !uploading && !analysisResult && (
            <motion.div
              key="error-view"
              className="w-full max-w-md mx-auto py-12"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-surface border border-danger/25 rounded-xl p-8 text-center shadow-md relative overflow-hidden flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-4 text-danger animate-float">
                  <ShieldAlert size={22} />
                </div>

                <h3 className="text-base font-semibold text-text-primary mb-1">Analysis Failed</h3>
                <p className="text-text-secondary text-xs mb-8 max-w-sm leading-relaxed">
                  {error}
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={clearFile}
                    className="btn-primary py-2 px-4 text-xs font-semibold flex-1"
                  >
                    Upload Another File
                  </button>
                  <Link
                    to="/dashboard"
                    className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 flex-1"
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 3: Detailed Report Dashboard */}
          {analysisResult && (
            <motion.div
              key="report"
              className="grid lg:grid-cols-3 gap-6 items-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              
              {/* Left Column: Radial score dial, Role compatibility, Details */}
              <div className="space-y-6 lg:col-span-1">
                
                {/* 1. circular Radial dial */}
                <div className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-6">ATS Compatibility Rating</span>
                  
                  <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                    {/* SVG Gauge */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke="#18181B"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke="#5E6AD2"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 60}
                        initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - analysisResult.score / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-bold text-text-primary font-mono tracking-tight">
                        {analysisResult.score}%
                      </span>
                      <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                        {analysisResult.score >= 85 ? 'Excellent' : analysisResult.score >= 70 ? 'Good' : 'Needs Work'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary px-2 leading-relaxed mt-2">
                    Our scanner extracted <strong className="text-text-primary font-medium">{analysisResult.achievements.length}</strong> accomplishments and analyzed skill patterns to compute this compatibility rating.
                  </p>
                </div>

                {/* 2. Job compatibility Match */}
                <div className="bg-surface border border-border rounded-xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2 border-b border-border pb-3">
                    <Target size={14} className="text-primary" /> Target Job Alignment
                  </h3>

                  <div className="space-y-4">
                    {Object.entries(analysisResult.compatibility).map(([role, pct]) => {
                      const displayRole = role.replace(/_/g, ' ');
                      return (
                        <div key={role}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="capitalize text-text-secondary font-medium">{displayRole}</span>
                            <span className={`font-mono font-bold ${pct >= 80 ? 'text-success' : pct >= 65 ? 'text-warning' : 'text-text-muted'}`}>
                              {pct}% Match
                            </span>
                          </div>
                          <div className="w-full bg-surface-secondary border border-border h-1.5 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${
                                pct >= 80 
                                  ? 'bg-success' 
                                  : pct >= 65 
                                    ? 'bg-warning' 
                                    : 'bg-primary'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1.2, delay: 0.2 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Start Tailored Mock CTA */}
                <div className="bg-surface border border-primary/20 rounded-xl p-6">
                  <Sparkles size={20} className="text-primary mb-3" />
                  <h3 className="font-semibold text-sm mb-1 text-text-primary">Practice Mock Interview</h3>
                  <p className="text-text-secondary text-xs leading-relaxed mb-4">
                    Ready to verify your skills? Start an immersive voice mock interview tailored specifically to this resume!
                  </p>
                  
                  <Link
                    to="/interview-setup"
                    className="btn-primary w-full py-2.5 text-center block text-xs font-semibold"
                  >
                    Launch Customized Session
                  </Link>
                </div>
              </div>

              {/* Right Column: Skill categories, timeline achievements, gap audits */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Skill Categories Inventory */}
                <div className="bg-surface border border-border rounded-xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5 flex items-center gap-2 border-b border-border pb-3">
                    <Wrench size={14} className="text-primary animate-pulse-slow" /> Classified Skills Inventory
                  </h3>

                  {Object.keys(analysisResult.skills).length === 0 ? (
                    <p className="text-xs text-text-muted italic text-center py-6">No specific technical skill categories detected.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(analysisResult.skills).map(([category, tags]) => (
                        <div key={category} className="bg-surface-secondary/40 border border-border/60 p-4 rounded-xl">
                          <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {category}
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-1 bg-surface-secondary border border-border text-text-secondary hover:text-text-primary font-medium rounded-lg text-xs transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. extracted Timeline achievements */}
                <div className="bg-surface border border-border rounded-xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5 flex items-center gap-2 border-b border-border pb-3">
                    <Briefcase size={14} className="text-primary" /> Parsed Achievements & Verbs
                  </h3>

                  {analysisResult.achievements.length === 0 ? (
                    <p className="text-xs text-text-muted italic text-center py-6">No active accomplishments parsed. Try adding verbs like "built" or "designed".</p>
                  ) : (
                    <div className="space-y-3.5 pl-4 border-l border-border relative">
                      {analysisResult.achievements.map((item, idx) => (
                        <div key={idx} className="relative group">
                          {/* Circle dot anchor */}
                          <div className="absolute -left-[20.5px] top-1.5 w-2 h-2 bg-primary rounded-full border border-background transition-transform" />
                           
                          <div className="bg-surface-secondary/40 border border-border rounded-lg p-3 hover:border-text-muted/40 transition-all">
                            <p className="text-xs text-text-secondary leading-relaxed font-mono">
                              "{item}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Strengths vs Gaps audit */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="bg-surface border border-success/20 rounded-xl p-5">
                    <h4 className="text-[10px] font-bold text-success uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 size={13} /> ATS Strengths
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-text-secondary flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle2 size={13} className="text-success mt-0.5 flex-shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations / Improvements */}
                  <div className="bg-surface border border-warning/20 rounded-xl p-5">
                    <h4 className="text-[10px] font-bold text-warning uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertTriangle size={13} /> Gaps & Improvements
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.improvements.map((imp, idx) => (
                        <li key={idx} className="text-xs text-text-secondary flex items-start gap-2.5 leading-relaxed">
                          <AlertTriangle size={13} className="text-warning mt-0.5 flex-shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>
    </div>
  );
}
