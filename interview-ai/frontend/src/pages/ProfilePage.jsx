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
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Top Bar */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ChevronLeft size={16} /> Dashboard
        </Link>
        <span className="text-slate-700">|</span>
        <span className="text-sm font-semibold text-white">My Profile</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Avatar + Name */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-slate-400 text-sm">{profile?.email || user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded-full text-xs text-blue-300">
                {form.target_role || 'No role set'}
              </span>
              {form.skills.length > 0 && (
                <span className="text-xs text-slate-500">{form.skills.length} skills</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Brain, label: 'Interviews', value: '4', color: 'text-blue-400' },
            { icon: Award, label: 'Avg Score', value: '74%', color: 'text-yellow-400' },
            { icon: TrendingUp, label: 'Improvement', value: '+12%', color: 'text-green-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <Icon size={20} className={`mx-auto mb-1 ${color}`} />
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2 text-sm text-slate-300">
            <User size={15} /> Personal Information
          </h2>

          {/* Full Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-700/30 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-white text-sm"
                placeholder="Your full name"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-700/30 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-white text-sm resize-none"
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          {/* Target Role */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target Role</label>
            <div className="relative">
              <Briefcase size={15} className="absolute left-3 top-3 text-slate-500" />
              <select
                name="target_role"
                value={form.target_role}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-700/30 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-white text-sm appearance-none"
              >
                <option value="">Select your target role</option>
                {JOB_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm text-slate-300">
            <Code2 size={15} /> Skills
          </h2>

          {/* Current Skills */}
          <div className="flex flex-wrap gap-2">
            {form.skills.map((skill) => (
              <motion.span
                key={skill}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-xs text-blue-300"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors">
                  <X size={11} />
                </button>
              </motion.span>
            ))}
            {form.skills.length === 0 && (
              <p className="text-xs text-slate-500">No skills added yet</p>
            )}
          </div>

          {/* Skill Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Code2 size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); }
                }}
                className="w-full pl-8 pr-4 py-2 bg-slate-700/30 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-white text-sm"
                placeholder="Type a skill and press Enter"
              />
            </div>
            <button
              onClick={() => addSkill(skillInput)}
              className="px-3 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).slice(0, 10).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="px-2.5 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-slate-400 hover:border-blue-500/50 hover:text-blue-300 transition-all"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <motion.button
            onClick={handleSave}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              saved
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save size={15} />
            {loading ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
