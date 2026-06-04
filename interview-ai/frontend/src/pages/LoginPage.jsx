import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-sans select-none">
      <motion.div
        className="w-full max-w-[400px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Card Panel */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
                <span className="font-bold text-sm tracking-tight">VI</span>
              </div>
              <span className="text-sm font-semibold tracking-tight text-text-primary">
                Virtual Interviewer
              </span>
            </Link>
            <h1 className="text-xl font-medium text-text-primary tracking-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-text-secondary text-xs leading-relaxed">
              Enter your credentials to access your interview workspace.
            </p>
          </div>

          {/* Error Alert */}
          {(error || localError) && (
            <motion.div
              className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded-lg flex gap-2.5 items-start"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-danger text-xs leading-relaxed">{error || localError}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="name@example.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-text-secondary">
                  Password
                </label>
                <a href="#" className="text-text-muted hover:text-text-primary text-[10px] transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-6 flex items-center justify-center gap-1.5 group"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-muted text-[10px] uppercase tracking-wider font-mono">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-text-secondary text-xs">
            New to the platform?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Demo Credentials Box */}
        <motion.div
          className="mt-4 p-4 bg-surface-secondary border border-border rounded-xl text-center text-[11px] text-text-secondary leading-relaxed space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            Quick access: Use <span className="font-semibold text-text-primary font-mono bg-surface border border-border px-1.5 py-0.5 rounded">demo@example.com</span> with password <span className="font-semibold text-text-primary font-mono bg-surface border border-border px-1.5 py-0.5 rounded">password123</span>
          </div>
          <div className="pt-2 border-t border-border/50">
            Or try immediately as a guest:{' '}
            <Link to="/interview/demo-session" className="text-primary hover:text-primary-hover font-semibold transition-colors">
              Try Guest Demo Interview &rarr;
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
