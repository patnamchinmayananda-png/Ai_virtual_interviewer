import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  { icon: BarChart2, label: 'Resume Analyzer', to: '/resume-analyzer', active: true },
  { icon: User, label: 'Profile', to: '/profile' },
];

export default function ResumeAnalyzerPage() {
  const navigate = useNavigate();
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
          {SIDEBAR_LINKS.map(({ icon: Icon, label, to, active }) => (
            <Link
              key={label}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                active 
                  ? 'bg-blue-600/10 border border-blue-500/20 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={18} className={active ? 'text-blue-400' : 'text-slate-400'} />
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
        
        {/* Header HUD */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="text-blue-400 animate-pulse-slow" size={28} /> Dedicated Resume Analyzer
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Upload your resume to perform instant ATS grading, skill categorisation, and career alignment checking.</p>
          </div>

          {analysisResult && (
            <button
              onClick={clearFile}
              className="px-4 py-2 border border-slate-850 hover:border-slate-700 bg-slate-900 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2"
            >
              <RefreshCw size={13} /> Analyze New Resume
            </button>
          )}
        </motion.div>

        {/* Dynamic state container */}
        <AnimatePresence mode="wait">
          
          {/* STATE 1: Dropzone Upload Form */}
          {!file && !analysisResult && (
            <motion.div
              key="dropzone"
              className="w-full max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div
                className={`border-2 border-dashed rounded-3xl p-14 text-center cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[360px] ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-500/5 shadow-glow shadow-blue-500/10' 
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none opacity-50" />

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.txt"
                />

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-purple-600/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-2xl animate-float">
                  <FileText className="text-blue-400" size={32} />
                </div>

                <h3 className="text-xl font-bold text-slate-100 mb-2">Drag and drop your resume</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md leading-relaxed">
                  Support formats: <strong className="text-slate-200">PDF</strong> or <strong className="text-slate-200">TXT</strong>. Ensure the file contains vector text layers (not a scanned image).
                </p>

                <button
                  type="button"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-xs font-bold hover:shadow-glow hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                >
                  Browse Files
                </button>

                {error && (
                  <motion.div
                    className="mt-6 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl max-w-md"
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
              className="w-full max-w-xl mx-auto py-16 flex flex-col items-center justify-center text-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative flex items-center justify-center mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
                <Brain className="absolute text-blue-400 animate-pulse" size={32} />
              </div>

              <h3 className="text-lg font-bold text-slate-200 mb-2">Analyzing Resume</h3>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase mb-5 animate-pulse">
                {uploadStage}
              </p>

              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{uploadProgress}% complete</span>
            </motion.div>
          )}

          {/* STATE 4: Error State View */}
          {file && error && !uploading && !analysisResult && (
            <motion.div
              key="error-view"
              className="w-full max-w-xl mx-auto py-12"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="backdrop-blur-md bg-slate-900/60 border border-red-500/25 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-600 to-amber-500" />
                
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-500/10 to-rose-600/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-2xl animate-float">
                  <ShieldAlert className="text-red-400" size={32} />
                </div>

                <h3 className="text-xl font-bold text-slate-100 mb-2">Analysis Failed</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-md leading-relaxed">
                  {error}
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={clearFile}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-glow hover:shadow-blue-500/30 rounded-xl text-xs font-bold transition-all transform hover:-translate-y-0.5"
                  >
                    Upload Another File
                  </button>
                  <Link
                    to="/dashboard"
                    className="px-6 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/60 rounded-xl text-xs font-bold text-slate-350 hover:text-white transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5"
                  >
                    <LayoutDashboard size={14} /> Go to Dashboard
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 3: Detailed Report Dashboard */}
          {analysisResult && (
            <motion.div
              key="report"
              className="grid lg:grid-cols-3 gap-8 items-start"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              
              {/* Left Column: Radial score dial, Role compatibility, Details */}
              <div className="space-y-8 lg:col-span-1">
                
                {/* 1. circular Radial dial */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center backdrop-blur shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500" />
                  
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">ATS Compatibility Rating</span>
                  
                  <div className="relative w-44 h-44 flex items-center justify-center mb-4">
                    {/* SVG Gauge */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="88"
                        cy="88"
                        r="72"
                        className="stroke-slate-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="88"
                        cy="88"
                        r="72"
                        className="stroke-blue-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 72}
                        initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - analysisResult.score / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-white font-mono tracking-tighter">
                        {analysisResult.score}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {analysisResult.score >= 85 ? 'Excellent' : analysisResult.score >= 70 ? 'Good' : 'Needs Optimization'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 px-4 leading-relaxed mt-2">
                    Our scanner extracted <strong className="text-slate-200">{analysisResult.achievements.length}</strong> accomplishments and categorized skills into categories to compute this score.
                  </p>
                </div>

                {/* 2. Job compatibility Match */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-2xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Target size={16} className="text-purple-400" /> Target Job Alignment
                  </h3>

                  <div className="space-y-4">
                    {Object.entries(analysisResult.compatibility).map(([role, pct]) => {
                      const displayRole = role.replace(/_/g, ' ');
                      return (
                        <div key={role}>
                          <div className="flex justify-between text-xs mb-1.5 font-medium">
                            <span className="capitalize text-slate-300">{displayRole}</span>
                            <span className={pct >= 80 ? 'text-green-400 font-bold' : pct >= 65 ? 'text-yellow-400 font-bold' : 'text-slate-500'}>
                              {pct}% Match
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 border border-slate-850 h-2 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${
                                pct >= 80 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                                  : pct >= 65 
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-400' 
                                    : 'bg-gradient-to-r from-blue-500 to-purple-600'
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
                <div className="bg-gradient-to-br from-blue-600/10 to-purple-700/10 border border-blue-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none" />
                  
                  <Sparkles size={24} className="text-blue-400 mb-3" />
                  <h3 className="font-bold text-base mb-1 text-white">Practice Mock Interview</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Ready to verify your skills? Start an immersive voice mock interview tailored specifically to this resume!
                  </p>
                  
                  <Link
                    to="/interview-setup"
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-glow hover:shadow-blue-500/30 text-center block rounded-xl text-xs font-bold transition-all transform hover:-translate-y-0.5"
                  >
                    Launch Customized Session
                  </Link>
                </div>
              </div>

              {/* Right Column: Skill categories, timeline achievements, gap audits */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Skill Categories Inventory */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-2xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-5 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Wrench size={16} className="text-blue-400 animate-pulse-slow" /> Classified Skills Inventory
                  </h3>

                  {Object.keys(analysisResult.skills).length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">No specific technical skill categories detected.</p>
                  ) : (
                    <div className="space-y-5">
                      {Object.entries(analysisResult.skills).map(([category, tags]) => (
                        <div key={category} className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold rounded-lg text-xs tracking-wide shadow-sm"
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
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-2xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-5 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Briefcase size={16} className="text-purple-400" /> Extracted Noun Accomplishments
                  </h3>

                  {analysisResult.achievements.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">No active action-accomplishments parsed. Try adding verbs like "built" or "designed".</p>
                  ) : (
                    <div className="space-y-4 pl-4 border-l-2 border-slate-850 relative">
                      {analysisResult.achievements.map((item, idx) => (
                        <div key={idx} className="relative group">
                          {/* Circle dot anchor */}
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-slate-950 shadow-glow shadow-purple-500/40 group-hover:scale-125 transition-transform" />
                          
                          <div className="bg-slate-950/20 border border-slate-850/80 rounded-xl p-3.5 hover:border-slate-700 transition-all">
                            <p className="text-xs text-slate-300 font-medium leading-relaxed font-mono">
                              "{item}..."
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
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-green-400">
                      <CheckCircle2 size={14} /> ATS Strengths
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-slate-350 flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle2 size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations / Improvements */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-yellow-400">
                      <AlertTriangle size={14} /> Gaps & Improvements
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.improvements.map((imp, idx) => (
                        <li key={idx} className="text-xs text-slate-350 flex items-start gap-2.5 leading-relaxed">
                          <AlertTriangle size={13} className="text-yellow-500 mt-0.5 flex-shrink-0" />
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
