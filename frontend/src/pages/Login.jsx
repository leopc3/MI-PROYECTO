import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('admin@ventasya.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand mb-2">VENTAS YA</h1>
          <p className="text-gray-500 text-sm">Control de Proyectos y Finanzas</p>
        </div>

        {error && <p className="bg-red-100 text-red-600 p-3 rounded-lg text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-brand hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;