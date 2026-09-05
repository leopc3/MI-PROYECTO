import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('admin@ventasya.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || err.response.data.error || 'Credenciales incorrectas');
        console.error("Backend Error:", err.response.data);
      } else {
        setError(err.message || 'Error de conexión');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4 relative transition-colors duration-200">
      <div className="absolute top-5 right-5">
        <ThemeToggle size={20} />
      </div>

      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand mb-2">VENTAS YA</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Control de Proyectos y Finanzas</p>
        </div>

        {error && <p className="bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-brand hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-[0.99]"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};


export default Login;