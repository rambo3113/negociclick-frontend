import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Protección CSRF básica: los navegadores no envían headers custom cross-origin sin preflight
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

export default api;
