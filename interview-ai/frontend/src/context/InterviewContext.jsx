import React, { createContext, useState, useCallback } from 'react';
import axios from 'axios';

export const InterviewContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function InterviewProvider({ children }) {
  const [currentSession, setCurrentSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadResume = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_BASE_URL}/interviews/upload-resume`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        }
      );
      return response.data; // returns { filename, resume_text }
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to upload and parse resume';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeResume = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_BASE_URL}/interviews/analyze-resume`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        }
      );
      return response.data; // returns full analysis dict
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to analyze resume';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (config) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/interviews/create-session`,
        config,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentSession(response.data);
      setQuestions([]);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to create session';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNextQuestion = useCallback(async (sessionId, previousAnswer = null) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/interviews/next-question`,
        {
          session_id: sessionId,
          previous_answer: previousAnswer,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestions((prev) => [...prev, response.data.question]);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to fetch question';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const evaluateAnswer = useCallback(async (sessionId, questionId, answer) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/interviews/evaluate-answer`,
        {
          session_id: sessionId,
          question_id: questionId,
          answer,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAnswers((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to evaluate answer';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/interviews/complete-session`,
        { session_id: sessionId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to complete session';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getReport = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/interviews/report/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to fetch report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/interviews/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to fetch sessions';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    currentSession,
    questions,
    answers,
    currentQuestionIndex,
    loading,
    error,
    createSession,
    uploadResume,
    analyzeResume,
    getNextQuestion,
    evaluateAnswer,
    completeSession,
    getReport,
    getSessions,
    setCurrentQuestionIndex,
  };

  return (
    <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = React.useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within InterviewProvider');
  }
  return context;
}
