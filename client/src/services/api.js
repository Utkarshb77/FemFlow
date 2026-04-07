import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('femflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Cycles
export const createCycle = (data) => API.post('/cycles', data);
export const getCycles = () => API.get('/cycles');
export const updateCycle = (id, data) => API.put(`/cycles/${id}`, data);
export const deleteCycle = (id) => API.delete(`/cycles/${id}`);
export const getCyclePrediction = () => API.get('/cycles/predict');

// Daily Logs
export const createOrUpdateLog = (data) => API.post('/logs', data);
export const getLogs = (from, to) => API.get('/logs', { params: { from, to } });
export const getTodayLog = () => API.get('/logs/today');
export const deleteLog = (id) => API.delete(`/logs/${id}`);

// Analytics
export const getPCOSScore = () => API.get('/analytics/pcos-score');
export const getSummary = () => API.get('/analytics/summary');
export const getAISuggestions = () => API.get('/analytics/ai-suggestions');

export default API;
