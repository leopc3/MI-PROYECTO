import axios from 'axios';

// En Vercel: frontend y backend están en el mismo dominio, usa URL relativa
// En local: usa localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: BASE_URL,
});

// Agrega el token automáticamente en cada request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
