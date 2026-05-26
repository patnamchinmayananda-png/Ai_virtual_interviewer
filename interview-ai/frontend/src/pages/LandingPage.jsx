import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Brain, TrendingUp, MessageCircle, Code2, Award } from 'lucide-react';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Questions',
      description: 'Adaptive questioning that adjusts based on your answers',
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed analytics and insights',
    },
    {
      icon: MessageCircle,
      title: 'Realistic Interviews',
      description: 'Experience real-world interview scenarios and feedback',
    },
    {
      icon: Code2,
      title: 'Coding Challenges',
      description: 'Practice technical interviews with integrated code editor',
    },
    {
      icon: Award,
      title: 'Detailed Feedback',
      description: 'Get comprehensive evaluation on every interview',
    },
    {
      icon: Zap,
      title: 'Instant Evaluation',
      description: 'Immediate AI feedback on technical correctness and clarity',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ y: [0, -50, 0], x: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ y: [0, 50, 0], x: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6 flex justify-between items-center">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain size={24} />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            InterviewAI
          </span>
        </motion.div>

        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            to="/login"
            className="px-6 py-2 text-sm font-medium hover:text-blue-400 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Get Started
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="relative z-10 px-6 py-20 max-w-7xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
          variants={itemVariants}
        >
          Master Your Interviews with{' '}
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Coaching
          </span>
        </motion.h1>

        <motion.p
          className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto"
          variants={itemVariants}
        >
          Practice unlimited interview scenarios with an intelligent AI interviewer that adapts
          to your skill level and provides real-time feedback
        </motion.p>

        <motion.div className="flex gap-4 justify-center" variants={itemVariants}>
          <Link
            to="/register"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Start Free Practice
          </Link>
          <button className="px-8 py-4 border border-slate-500 rounded-lg font-semibold hover:bg-slate-700 transition-colors">
            Learn More
          </button>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        className="relative z-10 px-6 py-20 max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose InterviewAI?</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="p-6 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl hover:border-blue-500/50 transition-all group"
              whileHover={{ y: -5, borderColor: 'rgb(59, 130, 246)' }}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-500/40 group-hover:to-purple-600/40 transition-all">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {[
            { number: '10K+', label: 'Questions' },
            { number: '500+', label: 'Users' },
            { number: '95%', label: 'Success Rate' },
            { number: '24/7', label: 'Available' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileInView={{ scale: 1, opacity: 1 }}
              initial={{ scale: 0.5, opacity: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="text-4xl font-bold text-blue-400 mb-2">{stat.number}</div>
              <div className="text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 rounded-2xl p-12 backdrop-blur">
          <h2 className="text-3xl font-bold mb-4">Ready to Ace Your Next Interview?</h2>
          <p className="text-slate-300 mb-8">Join thousands of professionals improving their interview skills with AI</p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Get Started Now
          </Link>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/50 px-6 py-12 mt-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-slate-400 text-sm">
          <div>&copy; 2024 InterviewAI. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
