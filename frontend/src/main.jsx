import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App'

// Interceptor Global de Red: Permite que el sistema mute mágicamente 
// de "localhost:5000" a tu entorno de Producción (HestiaCP) automáticamente.
axios.interceptors.request.use(config => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (config.url && config.url.startsWith('http://localhost:5000')) {
        config.url = config.url.replace('http://localhost:5000', apiUrl);
    }
    return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)