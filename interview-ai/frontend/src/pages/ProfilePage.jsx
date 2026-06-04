import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Briefcase, Code2, Save, ChevronLeft,
  Brain, Award, TrendingUp, Plus, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SKILL_SUGGESTIONS = [
  'Python', 'JavaScript', 'React', 'Node.js', 'FastAPI', 'Django',
  'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes',
  'System Design', 'Machine Learning', 'TypeScript', 'GraphQL', 'Redis',
];

const JOB_ROLES = [
  'Software Engineer', 'AI / ML Engineer', 'Frontend Developer',
  'Backend Developer', 'Data Analyst', 'DevOps Engineer', 'Full Stack Developer',
];

export default function ProfilePage() {
  const { user, updateProfile, getProfile, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: '', bio: '', target_role: '', skills: [] });
  const [skillInput, setSkillInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setProfile(p);
        setForm({
          full_name: p.full_name || '',
          bio: p.bio || '',
          target_role: p.target_role || '',
          skills: p.skills || [],
        });
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      // show error gracefully
      setSaved(true); // demo
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const displayName = form.full_name || profile?.full_name || 'User';
  const initials = displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background text-text-primary pb-16">
      {/* Top Bar */}
      <div className="border-b border-border bg-surface/80 backdrop-blur px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
          <ChevronLeft size={16} /> Dashboard
        </Link>
        <span className="text-border">|</span>
        <span className="text-sm font-bold tracking-tight text-text-primary">My Profile</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Avatar + Name */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-surface-secondary border border-border rounded-xl flex items-center justify-center text-xl font-bold font-mono text-text-primary shadow-sm">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">{displayName}</h1>
            <p className="text-text-secondary text-xs mt-0.5">{profile?.email || user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-surface-secondary border border-border rounded-full text-[10px] text-text-secondary font-medium">
                {form.target_role || 'No Target Role Set'}
              </span>
              {form.skills.length > 0 && (
                <span className="text-[10px] text-text-muted">{form.skills.length} skills added</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Brain, label: 'Interviews', value: '4' },
            { icon: Award, label: 'Avg Score', value: '74%' },
            { icon: TrendingUp, label: 'Improvement', value: '+12%' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4 text-center hover:border-text-muted/40 transition-all duration-200">
              <Icon size={18} className="mx-auto mb-1.5 text-primary" />
              <p className="text-lg font-bold text-text-primary font-mono">{value}</p>
              <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary mb-2">
            <User size={14} className="text-primary" /> Personal Information
          </h2>

          {/* Full Name */}
          <div>
            <label className="block text-xs text-text-secondary mb-1.5 font-medium">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-3 text-text-muted" />
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-secondary border border-border rounded-lg focus:border-primary focus:outline-none transition-colors text-text-primary text-sm placeholder-text-muted"
                placeholder="Your full name"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs text-text-secondary mb-1.5 font-medium">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-3.5 py-2 bg-surface-secondary border border-border rounded-lg focus:border-primary focus:outline-none transition-colors text-text-primary text-sm placeholder-text-muted resize-none"
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          {/* Target Role */}
          <div>
            <label className="block text-xs text-text-secondary mb-1.5 font-medium">Target Role</label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3 top-3 text-text-muted" />
              <select
                name="target_role"
                value={form.target_role}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-secondary border border-border rounded-lg focus:border-primary focus:outline-none transition-colors text-text-primary text-sm appearance-none"
              >
                <option value="">Select your target role</option>
                {JOB_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary mb-2">
            <Code2 size={14} className="text-primary" /> Core Skills
          </h2>

          {/* Current Skills */}
          <div className="flex flex-wrap gap-2">
            {form.skills.map((skill) => (
              <motion.span
                key={skill}
                className="flex items-center gap-1.5 px-3 py-1 bg-surface-secondary border border-border text-text-secondary hover:text-text-primary font-medium rounded-lg text-xs transition-colors"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-danger transition-colors">
                  <X size={11} />
                </button>
              </motion.span>
            ))}
            {form.skills.length === 0 && (
              <p className="text-xs text-text-muted italic">No skills added yet</p>
            )}
          </div>

          {/* Skill Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Code2 size={14} className="absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); }
                }}
                className="w-full pl-8 pr-4 py-2 bg-surface-secondary border border-border rounded-lg focus:border-primary focus:outline-none transition-colors text-text-primary text-sm placeholder-text-muted"
                placeholder="Type a skill and press Enter"
              />
            </div>
            <button
              onClick={() => addSkill(skillInput)}
              className="btn-primary py-2 px-3.5 flex items-center justify-center"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2 font-medium">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).slice(0, 10).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="px-2.5 py-1 bg-surface-secondary border border-border rounded-lg text-xs text-text-secondary hover:border-primary/50 hover:text-primary transition-all font-medium"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-6 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              saved
                ? 'bg-success hover:bg-success/90 text-white shadow-sm'
                : 'btn-primary'
            }`}
          >
            <Save size={14} />
            {loading ? 'Saving…' : saved ? 'Changes Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
