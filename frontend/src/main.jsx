import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App'

// Interceptor Global de Red: Permite que el sistema mute mágicamente 
// de "localhost:5000" a tu entorno de Producción (HestiaCP) automáticamente.
axios.interceptors.request.use(config => {
    const apiUrl = import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || ''}';
    if (config.url && config.url.startsWith('${import.meta.env.VITE_API_URL || ''}')) {
        config.url = config.url.replace('${import.meta.env.VITE_API_URL || ''}', apiUrl);
    }
    return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)