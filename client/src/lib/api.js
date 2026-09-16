import axios from 'axios';

const API_BASE = 'https://bhoomi-7e7h.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bhoomi_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;