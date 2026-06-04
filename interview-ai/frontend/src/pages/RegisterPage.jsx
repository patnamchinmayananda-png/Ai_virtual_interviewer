import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');

  const passwordStrength = (pwd) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = passwordStrength(formData.password);
  const strengthColors = ['bg-danger', 'bg-warning', 'bg-warning', 'bg-success'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.fullName || !formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(formData.email, formData.password, formData.fullName);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 font-sans select-none">
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
              Create an account
            </h1>
            <p className="text-text-secondary text-xs leading-relaxed">
              Start practicing technical and behavioral interviews today.
            </p>
          </div>

          {/* Error Alert */}
          {localError && (
            <motion.div
              className="mb-5 p-3 bg-danger/10 border border-danger/20 rounded-lg flex gap-2.5 items-start"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-danger text-xs leading-relaxed">{localError}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email Address */}
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

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="At least 8 characters"
                required
              />
              
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < strength ? strengthColors[strength - 1] : 'bg-surface-secondary'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-text-muted">
                    Strength:{' '}
                    <span className="font-semibold text-text-secondary">
                      {strengthLabels[strength - 1] || 'Weak'}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pr-9"
                  placeholder="Repeat password"
                  required
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle size={14} className="absolute right-3 top-3 text-success" />
                )}
              </div>
            </div>

            <p className="text-[10px] text-text-muted leading-relaxed">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-text-secondary hover:text-text-primary transition-colors underline">Terms of Service</a> and{' '}
              <a href="#" className="text-text-secondary hover:text-text-primary transition-colors underline">Privacy Policy</a>.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-6 flex items-center justify-center gap-1.5 group"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-muted text-[10px] uppercase tracking-wider font-mono">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Sign In Link */}
          <p className="text-center text-text-secondary text-xs">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
