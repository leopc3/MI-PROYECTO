import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Empresas from './pages/Empresas.jsx';
import Proyectos from './pages/Proyectos.jsx';
import Finanzas from './pages/Finanzas.jsx';
import Deudas from './pages/Deudas.jsx';
import Historial from './pages/Historial.jsx'; // <--- IMPORTAR
import ClienteView from './pages/ClienteView.jsx'; // <--- IMPORTAR (VISTA PÚBLICA)

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="pb-20 md:pb-0 md:ml-64 relative min-w-0">
          <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Privadas (Tus controles) */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/empresas" element={<ProtectedRoute><Empresas /></ProtectedRoute>} />
          <Route path="/proyectos" element={<ProtectedRoute><Proyectos /></ProtectedRoute>} />
          <Route path="/finanzas" element={<ProtectedRoute><Finanzas /></ProtectedRoute>} />
          <Route path="/deudas" element={<ProtectedRoute><Deudas /></ProtectedRoute>} />
          <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />

          {/* Ruta Pública (Vista del Cliente con enlace dinámico) */}
          <Route path="/enlace/:uuid" element={<ClienteView />} />
        </Routes>
        </div>
        
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;