import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  // JWT en Authorization header — el navegador nunca envía este header
  // automáticamente en requests cross-origin, lo que previene CSRF por diseño.
  // NO remover: es la primera línea de defensa anti-CSRF.
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Segundo escudo anti-CSRF: header custom que bloquea requests cross-origin simples.
  // NO remover sin revisar las implicaciones de seguridad.
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async error => {
    // Enriquecer el error con un mensaje legible y loguear siempre
    if (error.response) {
      // El backend respondió con un código de error (4xx / 5xx)
      console.error(`[api] HTTP ${error.response.status} — ${error.config?.url ?? '?'}`);
      error.userMessage = error.response.data?.error
        ?? `Error del servidor (${error.response.status})`;
    } else if (error.request) {
      // La solicitud se envió pero no llegó respuesta (red caída, timeout, CORS, etc.)
      error.userMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
    } else {
      error.userMessage = 'Error inesperado al procesar la solicitud.';
    }

    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
        { refreshToken },
      );
      Cookies.set('token', data.token, { expires: 1 / 96, secure: true, sameSite: 'Strict' }); // 15min
      Cookies.set('refreshToken', data.refreshToken, { expires: 7, secure: true, sameSite: 'Strict' });
      processQueue(null, data.token);
      original.headers.Authorization = `Bearer ${data.token}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
