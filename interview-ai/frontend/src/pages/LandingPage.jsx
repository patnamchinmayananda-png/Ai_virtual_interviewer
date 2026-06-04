import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, MessageSquare, Wrench, BarChart4, ArrowRight,
  Play, CheckCircle2, User, HelpCircle, Shield, Award
} from 'lucide-react';

export default function LandingPage() {
  const [dashboardActive, setDashboardActive] = React.useState(false);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const CountUp = ({ value, duration = 800, start = 0, suffix = "%", active = false }) => {
    const [count, setCount] = React.useState(start);
    React.useEffect(() => {
      if (!active) return;
      let startTime;
      const endVal = parseInt(value, 10);
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);
        const easeProgress = percentage * (2 - percentage);
        setCount(Math.floor(start + easeProgress * (endVal - start)));
        if (progress < duration) {
          window.requestAnimationFrame(step);
        } else {
          setCount(endVal);
        }
      };
      window.requestAnimationFrame(step);
    }, [value, duration, start, active]);

    return <span>{count}{suffix}</span>;
  };


  const steps = [
    {
      title: 'Upload Resume',
      desc: 'Provide your resume to tailor the interview to your specific background.'
    },
    {
      title: 'Resume Analysis',
      desc: 'Our AI extracts skills, tech stack, and background project details.'
    },
    {
      title: 'Interview Generated',
      desc: 'Get highly personalized questions mapped directly to your profile.'
    },
    {
      title: 'Attend Interview',
      desc: 'Engage in a live practice round using voice transcription or text.'
    },
    {
      title: 'Receive Report',
      desc: 'Get comprehensive scores, feedback, and key roadmap insights.'
    }
  ];

  const features = [
    {
      icon: FileText,
      title: 'Resume-Based Interviews',
      description: 'Generate adaptive technical and HR questions tailored specifically to your project experience, stack, and skillset.',
    },
    {
      icon: MessageSquare,
      title: 'Voice + Chat Practice',
      description: 'Simulate real face-to-face conversations. Switch between typing and high-accuracy hands-free voice transcription.',
    },
    {
      icon: Wrench,
      title: 'Detailed Feedback',
      description: 'Review granular question-by-question scoring and receive recommendations for improving your technical correctness.',
    },
    {
      icon: BarChart4,
      title: 'Track Improvement',
      description: 'Log and monitor your historical performance trend across multiple sessions with clear, easy-to-read charts.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary/20 selection:text-white overflow-x-hidden font-sans">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-white">
              <span className="font-bold text-xs tracking-tight">VI</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-text-primary">
              Virtual Interviewer
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</a>
            <Link to="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-primary text-xs font-medium"
            >
              Start Practice
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-28 max-w-7xl mx-auto border-b border-border">
        <motion.div
          className="grid lg:grid-cols-12 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-text-primary leading-[1.08] font-sans"
              variants={itemVariants}
            >
              Practice Interviews.<br />
              Get Better Offers.
            </motion.h1>

            <motion.p
              className="text-sm md:text-base text-text-secondary max-w-md leading-relaxed"
              variants={itemVariants}
            >
              Resume-aware mock interviews with personalized feedback, voice conversations, and measurable improvement tracking.
            </motion.p>

            <motion.div className="flex flex-wrap gap-3" variants={itemVariants}>
              <Link
                to="/interview/demo-session"
                className="btn-primary flex items-center gap-1.5 group text-xs"
              >
                Try Guest Demo
                <Play size={12} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="btn-secondary flex items-center gap-1.5 text-xs"
              >
                Create Account <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Hero Right: Premium Mockup */}
          <div className="lg:col-span-6">
            <motion.div
              className="bg-surface border border-border rounded-xl shadow-lg p-6 max-w-xl mx-auto text-left relative overflow-hidden"
              variants={itemVariants}
              onViewportEnter={() => setDashboardActive(true)}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
              
              {/* Window Controls */}
              <div className="flex gap-1.5 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>

              {/* Mockup Dashboard Content */}
              <div className="space-y-6">
                {/* Metric dials */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-surface-secondary border border-border rounded-lg">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Technical</span>
                    <span className="text-xl font-semibold text-text-primary font-mono">
                      <CountUp value="84" active={dashboardActive} />
                    </span>
                  </div>
                  <div className="p-3 bg-surface-secondary border border-border rounded-lg">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Communication</span>
                    <span className="text-xl font-semibold text-text-primary font-mono">
                      <CountUp value="79" active={dashboardActive} />
                    </span>
                  </div>
                  <div className="p-3 bg-surface-secondary border border-border rounded-lg">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Confidence</span>
                    <span className="text-xl font-semibold text-text-primary font-mono">
                      <CountUp value="88" active={dashboardActive} />
                    </span>
                  </div>
                </div>

                {/* Main list grids */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Recent Interviews */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={dashboardActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="p-4 bg-surface-secondary/40 border border-border rounded-lg space-y-3"
                  >
                    <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Recent Rounds</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs border-b border-border/40 pb-1.5">
                        <span className="text-text-primary font-medium">Frontend Engineer</span>
                        <span className="text-text-muted text-[10px] font-mono">Pass</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-b border-border/40 pb-1.5">
                        <span className="text-text-primary font-medium">DSA Round</span>
                        <span className="text-text-muted text-[10px] font-mono">Pass</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-primary font-medium">HR Round</span>
                        <span className="text-text-muted text-[10px] font-mono">Pass</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Areas To Improve */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={dashboardActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="p-4 bg-surface-secondary/40 border border-border rounded-lg space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Improvement Curve</h4>
                      <div className="h-16 flex items-end justify-between relative pt-2">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          <div className="border-b border-border/20 w-full h-0" />
                          <div className="border-b border-border/20 w-full h-0" />
                        </div>
                        <svg className="absolute inset-0 w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 100 40">
                          <motion.path
                            d="M 5 35 Q 25 25 50 15 T 95 8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={dashboardActive ? { pathLength: 1 } : { pathLength: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                          />
                          {/* Staggered dots */}
                          <motion.circle cx="5" cy="35" r="2.5" fill="#5E6AD2" initial={{ opacity: 0 }} animate={dashboardActive ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.4 }} />
                          <motion.circle cx="27" cy="24" r="2.5" fill="#5E6AD2" initial={{ opacity: 0 }} animate={dashboardActive ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.6 }} />
                          <motion.circle cx="50" cy="15" r="2.5" fill="#5E6AD2" initial={{ opacity: 0 }} animate={dashboardActive ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.8 }} />
                          <motion.circle cx="95" cy="8" r="2.5" fill="#5E6AD2" initial={{ opacity: 0 }} animate={dashboardActive ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 1.0 }} />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works Timeline */}
      <section id="how-it-works" className="px-6 py-20 max-w-7xl mx-auto border-b border-border">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl font-medium tracking-tight text-text-primary">How It Works</h2>
          <p className="text-xs text-text-secondary mt-2">A clean, transparent, and structured path to interview confidence.</p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-5 gap-8 relative max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.12
              }
            }
          }}
        >
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center md:items-start text-center md:text-left group">
              {/* Connector line (Desktop) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-[calc(40px_+_0.5rem)] w-[calc(100%_-_40px)] h-[1px] bg-border z-0">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.12 + 0.1, ease: "easeOut" }}
                    style={{ originX: 0 }}
                  />
                </div>
              )}

              {/* Connector line (Mobile) */}
              {idx < steps.length - 1 && (
                <div className="md:hidden absolute top-[40px] left-[20px] w-[1px] h-[calc(100%_-_16px)] bg-border z-0">
                  <motion.div
                    className="w-full bg-primary"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.12 + 0.1, ease: "easeOut" }}
                    style={{ originY: 0 }}
                  />
                </div>
              )}

              {/* Step circle node & details */}
              <motion.div
                className="flex flex-col items-center md:items-start z-10"
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4, ease: "easeOut" }
                  }
                }}
              >
                <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-mono font-bold text-text-secondary group-hover:border-primary transition-colors duration-200 shadow-sm">
                  {idx + 1}
                </div>
                <h3 className="text-sm font-medium text-text-primary mt-4">{step.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mt-2 max-w-[200px] md:max-w-none">
                  {step.desc}
                </p>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="px-6 py-20 max-w-7xl mx-auto border-b border-border">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl font-medium tracking-tight text-text-primary">Platform Capabilities</h2>
          <p className="text-xs text-text-secondary mt-2">Engineered to simulate realistic industry interviews with quantitative feedback.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 bg-surface border border-border rounded-xl space-y-4 hover:-translate-y-1 hover:border-text-secondary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-200"
            >
              <div className="w-8 h-8 rounded bg-surface-secondary border border-border flex items-center justify-center text-primary">
                <feat.icon size={16} />
              </div>
              <h3 className="text-sm font-medium text-text-primary">{feat.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl font-medium tracking-tight text-text-primary">Simple pricing</h2>
          <p className="text-xs text-text-secondary mt-2">Practice for free, scale to premium mock interviews when ready.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 bg-surface border border-border rounded-xl space-y-6 text-left">
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Free Practice</h3>
              <p className="text-2xl font-semibold text-text-primary font-mono mt-2">$0</p>
              <p className="text-xs text-text-muted mt-1">Perfect for fresh graduates and starters.</p>
            </div>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-success" /> 2 Voice interviews / month
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-success" /> Basic resume analysis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-success" /> Standard questions bank
              </li>
            </ul>
            <Link
              to="/register"
              className="block w-full py-2 border border-border hover:bg-surface-secondary text-center text-xs font-semibold rounded-lg text-text-primary transition-colors"
            >
              Start practicing
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="p-8 bg-surface border border-primary/30 rounded-xl space-y-6 text-left relative">
            <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase">
              Popular
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Pro Access</h3>
              <p className="text-2xl font-semibold text-text-primary font-mono mt-2">$19<span className="text-xs text-text-muted">/mo</span></p>
              <p className="text-xs text-text-muted mt-1">Complete prep suite for professionals.</p>
            </div>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-success" /> Unlimited voice interviews
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-success" /> Full resume-aware adaptive AI
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-success" /> Detailed performance insights
              </li>
            </ul>
            <Link
              to="/register"
              className="block w-full py-2 bg-primary hover:bg-primary-hover text-center text-xs font-semibold rounded-lg text-white transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-text-muted text-xs">
          <div>&copy; 2026 Virtual Interviewer. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
