import axios from 'axios';

const getBaseUrl = (): string => {
  // Em desenvolvimento local, usamos o proxy do Vite configurado para /api
  // Isso evita problemas de CORS e simula o ambiente de produção.
  if (import.meta.env?.DEV) {
    return '/api';
  }
  
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  return 'http://localhost:3100';
};

const BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratar erros globais se necessário
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.config?.url, error.message);
    return Promise.reject(error);
  }
);
