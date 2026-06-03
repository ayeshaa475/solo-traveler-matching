import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production'
  ? 'http://192.34.57.254:5001/api'
  : '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
