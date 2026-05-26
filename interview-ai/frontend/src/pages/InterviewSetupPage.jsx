import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ChevronLeft, ChevronRight, Users, Code2,
  Activity, Cpu, Clock, Zap, CheckCircle, Upload, FileText, Trash2, Loader2, AlertCircle
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';

const INTERVIEW_TYPES = [
  { value: 'hr', label: 'HR Interview', icon: Users, desc: 'Culture fit, motivation, and soft skills', color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/40' },
  { value: 'technical', label: 'Technical', icon: Code2, desc: 'DSA, system design, coding questions', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/40' },
  { value: 'behavioral', label: 'Behavioral', icon: Activity, desc: 'STAR method, past experiences', color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/40' },
  { value: 'system_design', label: 'System Design', icon: Cpu, desc: 'Architecture, scalability, design', color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/40' },
];

const JOB_ROLES = [
  { value: 'software_engineer', label: 'Software Engineer' },
  { value: 'ai_engineer', label: 'AI / ML Engineer' },
  { value: 'frontend_developer', label: 'Frontend Developer' },
  { value: 'backend_developer', label: 'Backend Developer' },
  { value: 'data_analyst', label: 'Data Analyst' },
];

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', desc: 'Entry level, fundamentals', color: 'border-green-500/50 bg-green-500/10' },
  { value: 'intermediate', label: 'Intermediate', desc: '2–4 years experience', color: 'border-yellow-500/50 bg-yellow-500/10' },
  { value: 'advanced', label: 'Advanced', desc: 'Senior / Lead level', color: 'border-red-500/50 bg-red-500/10' },
];

const DURATIONS = [15, 20, 30, 45, 60];

function SelectCard({ selected, onClick, children, className = '' }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
          : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
      } ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {selected && (
        <CheckCircle size={16} className="absolute top-3 right-3 text-blue-400" />
      )}
      {children}
    </motion.button>
  );
}

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const { createSession, uploadResume, loading } = useInterview();
  
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    interview_type: '',
    job_role: '',
    resume_text: '',
    difficulty: '',
    duration_minutes: 30,
  });

  // Resume drag & drop local state
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0); // 0 = empty, 1 = parsing, 2 = success
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const TOTAL_STEPS = 5;

  const set = (key, val) => setConfig((prev) => ({ ...prev, [key]: val }));

  const canNext = () => {
    if (step === 1) return !!config.interview_type;
    if (step === 2) return !!config.job_role;
    // Step 3 is optional (resume upload) - always can skip/next
    if (step === 4) return !!config.difficulty;
    return true;
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragOver(true);
    } else if (e.type === "dragleave") {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt') {
      setUploadError("Unsupported file format. Please upload a PDF or TXT resume.");
      return;
    }
    
    setUploadError('');
    setUploadedFileName(file.name);
    setUploadProgress(1); // 1 = parsing/uploading
    
    try {
      // Call Context multipart Axios endpoint
      const result = await uploadResume(file);
      set('resume_text', result.resume_text);
      setUploadProgress(2); // 2 = success
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || "Failed to extract text. Make sure the PDF is not an image scan.");
      setUploadProgress(0);
      setUploadedFileName('');
    }
  };

  const handleClearResume = () => {
    set('resume_text', '');
    setUploadedFileName('');
    setUploadProgress(0);
    setUploadError('');
  };

  const handleStart = async () => {
    try {
      const session = await createSession(config);
      navigate(`/interview/${session.id || session._id}`);
    } catch (err) {
      console.error(err);
      // Fallback
      navigate('/interview/demo-session');
    }
  };

  const stepTitles = ['Interview Type', 'Job Role', 'Upload Resume', 'Difficulty', 'Duration'];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none">
      {/* Top bar */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/40 backdrop-blur sticky top-0 z-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
          <ChevronLeft size={16} /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain size={16} />
          </div>
          <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Interview Setup Wizard
          </span>
        </div>
        <div className="text-xs text-slate-500 font-medium">Step {step} of {TOTAL_STEPS}</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-900">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 shadow-glow shadow-purple-500/50"
          initial={false}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl bg-slate-900/20 border border-slate-800/80 p-8 rounded-2xl backdrop-blur-md shadow-2xl relative">
          
          {/* Step Timeline Indicators */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {stepTitles.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i + 1 < step ? 'bg-green-500' : i + 1 === step ? 'bg-blue-500 shadow-glow shadow-blue-500/30' : 'bg-slate-800 text-slate-500 border border-slate-750'
                }`}>
                  {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                {i < stepTitles.length - 1 && (
                  <div className={`w-6 sm:w-10 h-px ${i + 1 < step ? 'bg-green-500' : 'bg-slate-800'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1 – Interview Type */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }} transition={{ duration: 0.2 }}>
                <h2 className="text-2xl font-bold mb-1 text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Choose Interview Type</h2>
                <p className="text-slate-400 text-xs text-center mb-6">Select the mock interview category you would like to practice</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {INTERVIEW_TYPES.map((t) => (
                    <SelectCard key={t.value} selected={config.interview_type === t.value} onClick={() => set('interview_type', t.value)}>
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} border ${t.border} flex items-center justify-center mb-3`}>
                        <t.icon size={20} className="text-white" />
                      </div>
                      <p className="font-semibold text-sm mb-1">{t.label}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{t.desc}</p>
                    </SelectCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 – Job Role */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }} transition={{ duration: 0.2 }}>
                <h2 className="text-2xl font-bold mb-1 text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Select Job Role</h2>
                <p className="text-slate-400 text-xs text-center mb-6">Mock questions will be tailored to the core competencies of this role</p>
                <div className="space-y-3">
                  {JOB_ROLES.map((r) => (
                    <SelectCard key={r.value} selected={config.job_role === r.value} onClick={() => set('job_role', r.value)}>
                      <span className="font-medium text-sm">{r.label}</span>
                    </SelectCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3 – Resume Upload (New Custom Step!) */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }} transition={{ duration: 0.2 }}>
                <h2 className="text-2xl font-bold mb-1 text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Upload Your Resume</h2>
                <p className="text-slate-400 text-xs text-center mb-6">Optional: Upload a PDF/TXT resume. AI will tailor questions based on your actual projects & skills!</p>
                
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-500/10 shadow-glow shadow-blue-500/25' 
                      : uploadProgress === 2 
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-slate-700 bg-slate-800/10 hover:border-slate-500 hover:bg-slate-800/25'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept=".pdf,.txt"
                  />

                  {uploadProgress === 0 ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-400">
                        <Upload size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-200">Drag & drop your resume file here</p>
                        <p className="text-xs text-slate-500 mt-1">Supports PDF or TXT formats (Max 5MB)</p>
                      </div>
                    </>
                  ) : uploadProgress === 1 ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-blue-300 animate-pulse">Extracting resume layers...</p>
                        <p className="text-xs text-slate-500 mt-1">This will take just a few seconds</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                        <FileText size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-green-400">Resume Parsed Successfully!</p>
                        <p className="text-xs text-slate-300 mt-1 italic">"{uploadedFileName}"</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress bar inside drop zone */}
                {uploadProgress === 1 && (
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-4">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600" 
                      animate={{ width: ["0%", "85%", "95%"] }} 
                      transition={{ duration: 4 }}
                    />
                  </div>
                )}

                {/* Success Indicator & Delete action */}
                {uploadProgress === 2 && (
                  <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl mt-4">
                    <span className="text-xs text-slate-400 font-medium">Ready for tailored questioning.</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearResume();
                      }}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={13} /> Remove File
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {uploadError && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl flex gap-2.5 items-start text-xs text-red-400 mt-4">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Upload Error</span>
                      <span>{uploadError}</span>
                    </div>
                  </div>
                )}

                <div className="text-center mt-6">
                  <span className="text-slate-500 text-xs">Don't have a resume? You can simply click <strong>Next</strong> to skip.</span>
                </div>
              </motion.div>
            )}

            {/* Step 4 – Difficulty */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }} transition={{ duration: 0.2 }}>
                <h2 className="text-2xl font-bold mb-1 text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Choose Difficulty</h2>
                <p className="text-slate-400 text-xs text-center mb-6">AI Interviewer adjusts target depths dynamically based on your answers</p>
                <div className="space-y-4">
                  {DIFFICULTIES.map((d) => (
                    <SelectCard key={d.value} selected={config.difficulty === d.value} onClick={() => set('difficulty', d.value)}>
                      <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-0.5 rounded text-xs font-bold border ${d.color}`}>
                          {d.label}
                        </div>
                        <p className="text-slate-400 text-sm">{d.desc}</p>
                      </div>
                    </SelectCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 5 – Duration & Summary */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }} transition={{ duration: 0.2 }}>
                <h2 className="text-2xl font-bold mb-1 text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Interview Duration</h2>
                <p className="text-slate-400 text-xs text-center mb-6">How long would you like the mock simulation to last?</p>

                {/* Duration Selector */}
                <div className="flex gap-3 justify-center flex-wrap mb-6">
                  {DURATIONS.map((d) => (
                    <motion.button
                      key={d}
                      type="button"
                      onClick={() => set('duration_minutes', d)}
                      className={`px-5 py-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        config.duration_minutes === d
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-glow shadow-blue-500/10'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500 bg-slate-800/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Clock size={13} /> {d} Min
                    </motion.button>
                  ))}
                </div>

                {/* Summary Card */}
                <div className="bg-slate-800/20 border border-slate-750 rounded-xl p-5 space-y-2.5 backdrop-blur-sm shadow-inner">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Simulation Summary</h3>
                  {[
                    { label: 'Category', value: config.interview_type?.replace('_', ' ') },
                    { label: 'Target Role', value: config.job_role?.replace(/_/g, ' ') },
                    { label: 'Tailored Resume', value: config.resume_text ? `Active (${uploadedFileName})` : 'None (Generic)' },
                    { label: 'Difficulty', value: config.difficulty },
                    { label: 'Duration limit', value: `${config.duration_minutes} minutes` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs border-b border-slate-800/60 pb-2 last:border-b-0 last:pb-0">
                      <span className="text-slate-500 font-medium">{label}</span>
                      <span className={`font-semibold capitalize ${label === 'Tailored Resume' && config.resume_text ? 'text-green-400' : 'text-slate-200'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav Buttons HUD */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <motion.button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 border border-slate-700 rounded-xl text-slate-300 hover:border-slate-500 hover:text-white transition-all font-semibold text-xs flex items-center justify-center gap-1.5 bg-slate-800/10"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <ChevronLeft size={15} /> Back
              </motion.button>
            )}

            {step < TOTAL_STEPS ? (
              <motion.button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext() || (step === 3 && uploadProgress === 1)}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-xs hover:shadow-glow hover:shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {step === 3 && !config.resume_text ? 'Skip & Next' : 'Next'} <ChevronRight size={15} />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-xl font-bold text-xs hover:shadow-glow hover:shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Zap size={14} fill="white" />
                {loading ? 'Entering Call Room...' : 'Start Tailored Interview'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
