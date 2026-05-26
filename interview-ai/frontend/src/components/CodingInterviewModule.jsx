import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, CheckCircle, XCircle, Loader2,
  Code2, Brain, ChevronDown, Clock, Award
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

const STARTER_CODE = {
  python: 'def two_sum(nums, target):\n    # Your solution here\n    pass\n',
  javascript: 'function twoSum(nums, target) {\n    // Your solution here\n}\n',
  java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n        return new int[]{};\n    }\n}\n',
  cpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your solution here\n    }\n};\n',
};

function TestCaseResult({ result }) {
  return (
    <div className={`p-3 rounded-lg border text-xs ${
      result.passed
        ? 'bg-green-500/10 border-green-500/30'
        : 'bg-red-500/10 border-red-500/30'
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        {result.passed
          ? <CheckCircle size={14} className="text-green-400" />
          : <XCircle size={14} className="text-red-400" />
        }
        <span className={`font-medium ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
          Test Case {result.test_case}
        </span>
      </div>
      <div className="space-y-1 text-slate-400">
        <p>Expected: <span className="text-slate-200 font-mono">{result.expected}</span></p>
        <p>Output: <span className={`font-mono ${result.passed ? 'text-green-300' : 'text-red-300'}`}>{result.actual}</span></p>
        {result.error && <p className="text-red-400">Error: {result.error}</p>}
      </div>
    </div>
  );
}

function AIReviewPanel({ review }) {
  if (!review) return null;

  const scoreColor = review.overall_score >= 80
    ? 'text-green-400' : review.overall_score >= 60
    ? 'text-yellow-400' : 'text-red-400';

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-bold ${scoreColor}`}>
          {Math.round(review.overall_score)}/100
        </span>
        <div>
          <p className="text-sm font-medium text-white">Code Quality Score</p>
          <p className="text-xs text-slate-500">{review.correctness}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900 rounded-lg p-2.5">
          <p className="text-slate-500 mb-1">Time Complexity</p>
          <p className="text-slate-200">{review.time_complexity}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-2.5">
          <p className="text-slate-500 mb-1">Space Complexity</p>
          <p className="text-slate-200">{review.space_complexity}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Suggestions</p>
        <ul className="space-y-1.5">
          {review.suggestions?.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function CodingInterviewModule({ question, sessionId, onComplete }) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTER_CODE.python);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('description'); // description | results | review
  const textareaRef = useRef(null);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang] || '');
    setResults(null);
  };

  const handleKeyDown = (e) => {
    // Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE}/coding/submit`,
        {
          question_id: question?.id || 'q001',
          language,
          code,
          session_id: sessionId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data);
      setActiveTab('results');
    } catch (err) {
      // Mock results for demo
      setResults({
        passed_tests: 2,
        total_tests: 3,
        test_results: [
          { test_case: 1, passed: true, expected: '[0, 1]', actual: '[0, 1]', error: null },
          { test_case: 2, passed: true, expected: '[1, 2]', actual: '[1, 2]', error: null },
          { test_case: 3, passed: false, expected: '[0, 1]', actual: 'ERROR', error: 'Index out of bounds' },
        ],
        ai_review: {
          overall_score: 75,
          correctness: '2/3 test cases passed',
          time_complexity: 'O(n) — good',
          space_complexity: 'O(n) — hash map',
          code_quality: 'Clean and readable',
          suggestions: [
            'Check edge cases for arrays with duplicate values',
            'Your hash map approach is optimal — O(n) time',
            'Consider adding a comment explaining your approach',
          ],
        },
      });
      setActiveTab('results');
    } finally {
      setLoading(false);
    }
  };

  const q = question || {
    title: 'Two Sum',
    difficulty: 'beginner',
    description: 'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.\n\nExample:\n  Input: nums = [2,7,11,15], target = 9\n  Output: [0,1]',
    tags: ['array', 'hash-table'],
    time_limit_seconds: 5,
  };

  const diffColor = { beginner: 'text-green-400', intermediate: 'text-yellow-400', advanced: 'text-red-400' }[q.difficulty] || 'text-blue-400';

  return (
    <div className="flex h-[580px] bg-slate-950 rounded-xl overflow-hidden border border-slate-700">
      {/* LEFT: Question + Output */}
      <div className="w-96 border-r border-slate-800 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {['description', 'results', 'review'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-white text-sm">{q.title}</h3>
                  <span className={`text-xs font-medium capitalize ${diffColor}`}>
                    {q.difficulty}
                  </span>
                </div>

                <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed mb-4 font-sans">
                  {q.description}
                </pre>

                {q.tags && (
                  <div className="flex flex-wrap gap-1.5">
                    {q.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={12} />
                  Time limit: {q.time_limit_seconds}s
                </div>
              </motion.div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {!results ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    <Play size={28} className="mx-auto mb-3 opacity-30" />
                    Submit your code to see test results
                  </div>
                ) : (
                  <>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      results.all_passed ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'
                    }`}>
                      {results.all_passed
                        ? <CheckCircle size={16} className="text-green-400" />
                        : <Award size={16} className="text-yellow-400" />
                      }
                      <span className={`text-sm font-medium ${results.all_passed ? 'text-green-300' : 'text-yellow-300'}`}>
                        {results.passed_tests}/{results.total_tests} Tests Passed
                      </span>
                    </div>

                    {results.test_results?.map((r, i) => (
                      <TestCaseResult key={i} result={r} />
                    ))}
                  </>
                )}
              </motion.div>
            )}

            {/* AI Review Tab */}
            {activeTab === 'review' && (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {!results?.ai_review ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    <Brain size={28} className="mx-auto mb-3 opacity-30" />
                    Submit your code to get AI review
                  </div>
                ) : (
                  <AIReviewPanel review={results.ai_review} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Code Editor */}
      <div className="flex-1 flex flex-col">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 pr-7 text-xs text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCode(STARTER_CODE[language] || '')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:border-slate-500 transition-all"
            >
              <RotateCcw size={12} /> Reset
            </button>

            <motion.button
              onClick={handleSubmit}
              disabled={loading || !code.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading
                ? <><Loader2 size={12} className="animate-spin" /> Running...</>
                : <><Play size={12} /> Run & Submit</>
              }
            </motion.button>
          </div>
        </div>

        {/* Code Textarea */}
        <div className="flex-1 relative">
          {/* Line Numbers */}
          <div
            className="absolute left-0 top-0 bottom-0 w-10 bg-slate-900/80 border-r border-slate-800 text-right pr-2 pt-3 select-none overflow-hidden"
            style={{ lineHeight: '21px' }}
          >
            {code.split('\n').map((_, i) => (
              <div key={i} className="text-slate-600 text-xs" style={{ fontSize: '11px' }}>
                {i + 1}
              </div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="absolute inset-0 pl-12 pr-4 pt-3 pb-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none w-full h-full"
            style={{ lineHeight: '21px', tabSize: 4 }}
          />
        </div>

        {/* Status Bar */}
        <div className="border-t border-slate-800 px-4 py-1.5 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span><Code2 size={11} className="inline mr-1" />{language}</span>
            <span>{code.split('\n').length} lines</span>
            <span>{code.length} chars</span>
          </div>
          {results && (
            <span className={`text-xs font-medium ${
              results.all_passed ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {results.passed_tests}/{results.total_tests} passed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
