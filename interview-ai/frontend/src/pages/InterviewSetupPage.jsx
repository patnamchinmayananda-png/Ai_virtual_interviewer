import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ChevronLeft, ChevronRight, Users, Code2,
  Activity, Cpu, Clock, Zap, CheckCircle, Upload, FileText, Trash2, Loader2, AlertCircle
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';

const INTERVIEW_TYPES = [
  { value: 'hr', label: 'HR Interview', icon: Users, desc: 'Culture fit, motivation, and soft skills' },
  { value: 'technical', label: 'Technical', icon: Code2, desc: 'DSA, system design, coding questions' },
  { value: 'behavioral', label: 'Behavioral', icon: Activity, desc: 'STAR method, past experiences' },
  { value: 'system_design', label: 'System Design', icon: Cpu, desc: 'Architecture, scalability, design' },
];

const JOB_ROLES = [
  { value: 'software_engineer', label: 'Software Engineer' },
  { value: 'ai_engineer', label: 'AI / ML Engineer' },
  { value: 'frontend_developer', label: 'Frontend Developer' },
  { value: 'backend_developer', label: 'Backend Developer' },
  { value: 'data_analyst', label: 'Data Analyst' },
];

const DIFFICULTIES_STANDARD = [
  { value: 'beginner', label: 'Beginner', desc: 'Entry level, fundamentals', color: 'border-success/30 bg-success/15 text-success' },
  { value: 'intermediate', label: 'Intermediate', desc: '2–4 years experience', color: 'border-warning/30 bg-warning/15 text-warning' },
  { value: 'advanced', label: 'Advanced', desc: 'Senior / Lead level', color: 'border-danger/30 bg-danger/15 text-danger' },
];

const DIFFICULTIES_ENGINEERING = [
  { value: 'fresher', label: 'Fresher', desc: 'College grads, basic concepts', color: 'border-success/30 bg-success/15 text-success' },
  { value: 'sde_1', label: 'SDE 1', desc: '1–3 years exp, core coding/design', color: 'border-warning/30 bg-warning/15 text-warning' },
  { value: 'sde_2', label: 'SDE 2', desc: '3+ years exp, system scalability', color: 'border-danger/30 bg-danger/15 text-danger' },
];

const DURATIONS = [15, 20, 30, 45, 60];

function SelectCard({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-surface-secondary/40 hover:border-text-muted/40'
      } ${className}`}
    >
      {selected && (
        <CheckCircle size={15} className="absolute top-3.5 right-3.5 text-primary" />
      )}
      {children}
    </button>
  );
}

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const { createSession, uploadResume, loading } = useInterview();
  
  const [step, setStep] = useState(1);
  const [difficultyTier, setDifficultyTier] = useState('standard'); // standard or engineering
  const [extractedDetails, setExtractedDetails] = useState(null);
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
  const [processingStage, setProcessingStage] = useState(0); // 0 = idle, 1 = upload, 2 = analyze, 3 = skills, 4 = projects, 5 = generate, 6 = ready
  const [tempDetails, setTempDetails] = useState(null);
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
    setProcessingStage(1); // Uploading Resume
    
    try {
      // Call Context multipart Axios endpoint
      const result = await uploadResume(file);
      setTempDetails(result.extracted_details);

      // Run sequential state machine step delays for premium experience
      await new Promise(r => setTimeout(r, 600));
      setProcessingStage(2); // Analyzing Resume

      await new Promise(r => setTimeout(r, 800));
      setProcessingStage(3); // Detecting Skills

      await new Promise(r => setTimeout(r, 900));
      setProcessingStage(4); // Detecting Projects

      await new Promise(r => setTimeout(r, 900));
      setProcessingStage(5); // Customizing Model

      await new Promise(r => setTimeout(r, 700));
      setProcessingStage(6); // Success ready

      await new Promise(r => setTimeout(r, 500));
      
      set('resume_text', result.resume_text);
      setExtractedDetails(result.extracted_details);
      setUploadProgress(2); // 2 = success
      setProcessingStage(0);
      setTempDetails(null);
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || "Failed to extract text. Make sure the PDF is not an image scan.");
      setUploadProgress(0);
      setUploadedFileName('');
      setProcessingStage(0);
      setTempDetails(null);
    }
  };

  const handleClearResume = () => {
    set('resume_text', '');
    setExtractedDetails(null);
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
    <div className="min-h-screen bg-background text-text-primary flex flex-col select-none">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-surface/50 backdrop-blur sticky top-0 z-10">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm font-semibold">
          <ChevronLeft size={16} /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border border-border bg-surface-secondary flex items-center justify-center text-primary">
            <Brain size={16} />
          </div>
          <span className="font-bold text-sm tracking-tight text-text-primary">
            Interview Setup Wizard
          </span>
        </div>
        <div className="text-xs text-text-muted font-medium">Step {step} of {TOTAL_STEPS}</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-secondary">
        <motion.div
          className="h-full bg-primary"
          initial={false}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-surface border border-border p-8 rounded-xl shadow-md relative">
          
          {/* Step Timeline Indicators */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {stepTitles.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border ${
                  i + 1 < step 
                    ? 'bg-success border-success text-white' 
                    : i + 1 === step 
                      ? 'bg-primary border-primary text-white shadow-sm' 
                      : 'bg-surface-secondary border-border text-text-muted'
                }`}>
                  {i + 1 < step ? <CheckCircle size={13} /> : i + 1}
                </div>
                {i < stepTitles.length - 1 && (
                  <div className={`w-6 sm:w-8 h-px ${i + 1 < step ? 'bg-success' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1 – Interview Type */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-xl font-bold tracking-tight text-text-primary text-center mb-1">Choose Interview Type</h2>
                <p className="text-text-secondary text-xs text-center mb-6">Select the mock interview category you would like to practice</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {INTERVIEW_TYPES.map((t) => (
                    <SelectCard key={t.value} selected={config.interview_type === t.value} onClick={() => set('interview_type', t.value)}>
                      <div className="w-10 h-10 rounded-lg border border-border bg-surface-secondary flex items-center justify-center mb-3 text-primary">
                        <t.icon size={18} />
                      </div>
                      <p className="font-semibold text-xs text-text-primary mb-1">{t.label}</p>
                      <p className="text-text-secondary text-[11px] leading-relaxed">{t.desc}</p>
                    </SelectCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 – Job Role */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-xl font-bold tracking-tight text-text-primary text-center mb-1">Select Job Role</h2>
                <p className="text-text-secondary text-xs text-center mb-6">Mock questions will be tailored to the core competencies of this role</p>
                <div className="space-y-3">
                  {JOB_ROLES.map((r) => (
                    <SelectCard key={r.value} selected={config.job_role === r.value} onClick={() => set('job_role', r.value)}>
                      <span className="font-semibold text-xs text-text-primary">{r.label}</span>
                    </SelectCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3 – Resume Upload */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-xl font-bold tracking-tight text-text-primary text-center mb-1">Upload Your Resume</h2>
                <p className="text-text-secondary text-xs text-center mb-6">Optional: Upload a PDF/TXT resume. AI will tailor questions based on your actual projects & skills!</p>
                
                {uploadProgress === 0 ? (
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-8 border border-dashed rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                      isDragOver 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-surface-secondary/20 hover:border-text-muted/40 hover:bg-surface-secondary/40'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      accept=".pdf,.txt"
                    />
                    <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary">
                      <Upload size={18} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-text-primary">Drag & drop your resume file here</p>
                      <p className="text-[10px] text-text-muted mt-1">Supports PDF or TXT formats (Max 5MB)</p>
                    </div>
                  </div>
                ) : uploadProgress === 1 ? (
                  <div className="w-full bg-surface-secondary/40 border border-border p-6 rounded-xl space-y-6">
                    <div className="space-y-4">
                      {/* Step 1: Uploading Resume */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {processingStage > 1 ? (
                            <CheckCircle size={14} className="text-success" />
                          ) : processingStage === 1 ? (
                            <Loader2 size={14} className="text-primary animate-spin" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-border" />
                          )}
                          <span className={processingStage === 1 ? "font-semibold text-text-primary" : "text-text-secondary"}>
                            Uploading Resume
                          </span>
                        </div>
                        {processingStage === 1 && <span className="text-text-muted text-[10px] font-mono animate-pulse">Uploading</span>}
                      </div>

                      {/* Step 2: Analyzing Resume */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {processingStage > 2 ? (
                            <CheckCircle size={14} className="text-success" />
                          ) : processingStage === 2 ? (
                            <Loader2 size={14} className="text-primary animate-spin" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-border" />
                          )}
                          <span className={processingStage === 2 ? "font-semibold text-text-primary" : "text-text-secondary"}>
                            Analyzing Resume Layers
                          </span>
                        </div>
                        {processingStage === 2 && <span className="text-text-muted text-[10px] font-mono animate-pulse">Processing</span>}
                      </div>

                      {/* Step 3: Detecting Skills */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            {processingStage > 3 ? (
                              <CheckCircle size={14} className="text-success" />
                            ) : processingStage === 3 ? (
                              <Loader2 size={14} className="text-primary animate-spin" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-border" />
                            )}
                            <span className={processingStage === 3 ? "font-semibold text-text-primary" : "text-text-secondary"}>
                              Detecting Skills
                            </span>
                          </div>
                          {processingStage === 3 && <span className="text-text-muted text-[10px] font-mono animate-pulse">Extracting</span>}
                        </div>
                        {processingStage >= 3 && (
                          <div className="flex flex-wrap gap-1.5 pl-6">
                            {(tempDetails?.skills?.length ? tempDetails.skills : ["React", "Node.js", "Python", "MongoDB"]).map((s, idx) => (
                              <motion.span
                                key={s}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: idx * 0.1 }}
                                className="px-2 py-0.5 rounded bg-surface border border-border text-text-primary text-[10px] font-mono flex items-center gap-1"
                              >
                                ✓ {s}
                              </motion.span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Step 4: Detecting Projects */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            {processingStage > 4 ? (
                              <CheckCircle size={14} className="text-success" />
                            ) : processingStage === 4 ? (
                              <Loader2 size={14} className="text-primary animate-spin" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-border" />
                            )}
                            <span className={processingStage === 4 ? "font-semibold text-text-primary" : "text-text-secondary"}>
                              Detecting Projects
                            </span>
                          </div>
                          {processingStage === 4 && <span className="text-text-muted text-[10px] font-mono animate-pulse">Scanning</span>}
                        </div>
                        {processingStage >= 4 && (
                          <div className="space-y-1 pl-6">
                            {(tempDetails?.projects?.length ? tempDetails.projects : ["AI Virtual Interviewer", "Portfolio Website"]).map((p, idx) => (
                              <motion.div
                                key={p}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: idx * 0.15 }}
                                className="text-text-secondary text-[10px] flex items-center gap-1.5"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {p}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Step 5: Generating Personalized Interview */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {processingStage > 5 ? (
                            <CheckCircle size={14} className="text-success" />
                          ) : processingStage === 5 ? (
                            <Loader2 size={14} className="text-primary animate-spin" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-border" />
                          )}
                          <span className={processingStage === 5 ? "font-semibold text-text-primary" : "text-text-secondary"}>
                            Generating Personalized Interview Model
                          </span>
                        </div>
                        {processingStage === 5 && <span className="text-text-muted text-[10px] font-mono animate-pulse">Calibrating</span>}
                      </div>

                      {/* Step 6: Ready */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {processingStage >= 6 ? (
                            <CheckCircle size={14} className="text-success" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-border" />
                          )}
                          <span className={processingStage === 6 ? "font-semibold text-success" : "text-text-secondary"}>
                            Ready
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar indicator */}
                    <div className="w-full bg-border h-1 rounded-full overflow-hidden mt-4">
                      <motion.div 
                        className="h-full bg-primary" 
                        animate={{ width: `${(processingStage / 6) * 100}%` }} 
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-full p-6 border border-dashed border-success/40 bg-success/5 rounded-xl flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success border border-success/30">
                        <FileText size={18} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-success">Resume Parsed Successfully!</p>
                        <p className="text-[10px] text-text-secondary mt-1 italic">"{uploadedFileName}"</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-surface-secondary border border-border p-3 rounded-lg">
                      <span className="text-[11px] text-text-secondary font-medium">Ready for tailored questioning.</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearResume();
                        }}
                        className="text-xs font-semibold text-danger hover:text-danger/95 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={13} /> Remove File
                      </button>
                    </div>

                    {extractedDetails && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-surface-secondary/60 border border-border rounded-lg space-y-3"
                      >
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle size={15} />
                          <span className="text-xs font-medium text-success">Your interview has been personalized based on your resume.</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          {extractedDetails.skills?.length > 0 && (
                            <div>
                              <span className="text-text-muted block font-semibold uppercase tracking-wider text-[9px] mb-1">Detected Skills</span>
                              <div className="flex flex-wrap gap-1">
                                {extractedDetails.skills.map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-primary">✓ {s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {extractedDetails.technologies?.length > 0 && (
                            <div>
                              <span className="text-text-muted block font-semibold uppercase tracking-wider text-[9px] mb-1">Technologies</span>
                              <div className="flex flex-wrap gap-1">
                                {extractedDetails.technologies.map((t) => (
                                  <span key={t} className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-primary">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {extractedDetails.projects?.length > 0 && (
                          <div className="text-[11px]">
                            <span className="text-text-muted block font-semibold uppercase tracking-wider text-[9px] mb-1">Projects Focus</span>
                            <ul className="space-y-0.5 text-text-secondary list-disc pl-3">
                              {extractedDetails.projects.map((p) => (
                                <li key={p}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {(extractedDetails.experience?.length > 0 || extractedDetails.education?.length > 0) && (
                          <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 border-t border-border/50">
                            {extractedDetails.experience?.length > 0 && (
                              <div>
                                <span className="text-text-muted block font-semibold uppercase tracking-wider text-[9px] mb-1">Experience</span>
                                <span className="text-text-secondary truncate block">{extractedDetails.experience[0]}</span>
                              </div>
                            )}
                            {extractedDetails.education?.length > 0 && (
                              <div>
                                <span className="text-text-muted block font-semibold uppercase tracking-wider text-[9px] mb-1">Education</span>
                                <span className="text-text-secondary truncate block">{extractedDetails.education[0]}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {uploadError && (
                  <div className="bg-danger/10 border border-danger/25 p-3.5 rounded-lg flex gap-2.5 items-start text-xs text-danger mt-4">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Upload Error</span>
                      <span>{uploadError}</span>
                    </div>
                  </div>
                )}

                <div className="text-center mt-6">
                  <span className="text-text-muted text-[10px]">Don't have a resume? You can simply click <strong>Next</strong> to skip.</span>
                </div>
              </motion.div>
            )}

            {/* Step 4 – Difficulty */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-xl font-bold tracking-tight text-text-primary text-center mb-1">Choose Difficulty</h2>
                <p className="text-text-secondary text-xs text-center mb-6">AI Interviewer adjusts target depths dynamically based on your answers</p>
                
                {/* Tier Switcher Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-surface-secondary border border-border p-1 rounded-lg flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDifficultyTier('standard');
                        set('difficulty', '');
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        difficultyTier === 'standard'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Standard Tiers
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDifficultyTier('engineering');
                        set('difficulty', '');
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        difficultyTier === 'engineering'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Engineering Tiers
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {(difficultyTier === 'standard' ? DIFFICULTIES_STANDARD : DIFFICULTIES_ENGINEERING).map((d) => (
                    <SelectCard key={d.value} selected={config.difficulty === d.value} onClick={() => set('difficulty', d.value)}>
                      <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${d.color}`}>
                          {d.label}
                        </div>
                        <p className="text-text-secondary text-xs">{d.desc}</p>
                      </div>
                    </SelectCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 5 – Duration & Summary */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-xl font-bold tracking-tight text-text-primary text-center mb-1">Interview Duration</h2>
                <p className="text-text-secondary text-xs text-center mb-6">How long would you like the mock simulation to last?</p>

                {/* Duration Selector */}
                <div className="flex gap-3 justify-center flex-wrap mb-6">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set('duration_minutes', d)}
                      className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        config.duration_minutes === d
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'border-border text-text-secondary hover:text-text-primary bg-surface-secondary/40'
                      }`}
                    >
                      <Clock size={13} /> {d} Min
                    </button>
                  ))}
                </div>

                {/* Summary Card */}
                <div className="bg-surface-secondary/60 border border-border rounded-xl p-5 space-y-2.5">
                  <h3 className="font-bold text-[10px] text-text-secondary uppercase tracking-wider mb-2">Simulation Summary</h3>
                  {[
                    { label: 'Category', value: config.interview_type?.replace('_', ' ') },
                    { label: 'Target Role', value: config.job_role?.replace(/_/g, ' ') },
                    { label: 'Tailored Resume', value: config.resume_text ? `Active (${uploadedFileName})` : 'None (Generic)' },
                    { label: 'Difficulty', value: config.difficulty },
                    { label: 'Duration limit', value: `${config.duration_minutes} minutes` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs border-b border-border pb-2 last:border-b-0 last:pb-0 last:border-transparent">
                      <span className="text-text-secondary font-medium">{label}</span>
                      <span className={`font-semibold capitalize ${label === 'Tailored Resume' && config.resume_text ? 'text-success' : 'text-text-primary'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav Buttons HUD */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="btn-secondary flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext() || (step === 3 && uploadProgress === 1)}
                className="btn-primary flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {step === 3 && !config.resume_text ? 'Skip & Next' : 'Next'} <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={loading}
                className="btn-primary flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Zap size={14} />
                {loading ? 'Entering Call Room...' : 'Start Tailored Interview'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
