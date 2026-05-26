import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

/* ─── Button ─────────────────────────────────────── */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white bg-transparent',
    danger: 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
    outline: 'border border-blue-500/50 text-blue-400 hover:bg-blue-500/10',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
    xl: 'px-9 py-4 text-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ─── Input ─────────────────────────────────────── */
export function Input({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        )}
        <input
          className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 bg-slate-700/30 border ${
            error ? 'border-red-500' : 'border-slate-600'
          } rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-white placeholder-slate-500 text-sm ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

/* ─── Textarea ─────────────────────────────────── */
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2.5 bg-slate-700/30 border ${
          error ? 'border-red-500' : 'border-slate-600'
        } rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-white placeholder-slate-500 text-sm resize-none ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* ─── Card ───────────────────────────────────────── */
export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <motion.div
      className={`bg-slate-800/50 border border-slate-700 rounded-xl p-5 ${
        hover ? 'cursor-pointer hover:border-slate-600' : ''
      } ${className}`}
      whileHover={hover ? { y: -2 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/* ─── Badge ──────────────────────────────────────── */
export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-slate-700 text-slate-300 border-slate-600',
    blue: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    purple: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    green: 'bg-green-500/20 border-green-500/40 text-green-300',
    yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
    red: 'bg-red-500/20 border-red-500/40 text-red-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center border rounded-full font-medium ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}

/* ─── LoadingSpinner ──────────────────────────────── */
export function LoadingSpinner({ size = 24, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        className="border-4 border-blue-500 border-t-transparent rounded-full"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
}

/* ─── FullPageLoader ──────────────────────────────── */
export function FullPageLoader({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <LoadingSpinner size={40} text={text} />
    </div>
  );
}

/* ─── ScoreRing ──────────────────────────────────── */
export function ScoreRing({ score = 0, size = 100, strokeWidth = 8, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1e293b" strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
        />
        <text
          x="50%" y="50%"
          dominantBaseline="middle" textAnchor="middle"
          fill="white"
          fontSize={size / 5}
          fontWeight="bold"
          style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}
        >
          {score}%
        </text>
      </svg>
      {label && <p className="text-xs text-slate-400 text-center">{label}</p>}
    </div>
  );
}

/* ─── ScorePill ──────────────────────────────────── */
export function ScorePill({ label, value = 0, maxValue = 10 }) {
  const pct = Math.round((value / maxValue) * 100);
  const color =
    pct >= 80 ? 'text-green-400' :
    pct >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="flex flex-col items-center">
      <span className={`text-xl font-bold ${color}`}>
        {Math.round(value)}/{maxValue}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────── */
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed left-1/2 top-1/2 z-50 w-full ${sizes[size]} -translate-x-1/2 -translate-y-1/2`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Alert ──────────────────────────────────────── */
export function Alert({ type = 'info', children }) {
  const types = {
    info: 'bg-blue-500/10 border-blue-500/50 text-blue-300',
    success: 'bg-green-500/10 border-green-500/50 text-green-300',
    warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300',
    error: 'bg-red-500/10 border-red-500/50 text-red-300',
  };

  return (
    <motion.div
      className={`p-4 border rounded-lg text-sm ${types[type]}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── ProgressBar ────────────────────────────────── */
export function ProgressBar({ value = 0, max = 100, color = 'blue', label }) {
  const percentage = Math.round((value / max) * 100);
  const colors = {
    blue: 'from-blue-500 to-purple-600',
    green: 'from-green-500 to-emerald-600',
    yellow: 'from-yellow-500 to-orange-500',
    red: 'from-red-500 to-pink-600',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      {Icon && <Icon size={48} className="mx-auto mb-4 text-slate-600" />}
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
}

/* ─── Tooltip ────────────────────────────────────── */
export function Tooltip({ children, text, position = 'top' }) {
  const [visible, setVisible] = React.useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className={`absolute z-50 px-2.5 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white whitespace-nowrap pointer-events-none ${positions[position]}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────── */
export function Avatar({ name = '', size = 'md', src }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
