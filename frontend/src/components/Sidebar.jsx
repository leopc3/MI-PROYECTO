import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, Building2, FolderKanban, Wallet, History, CreditCard } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/',          icon: <Home size={22} />,         label: 'Inicio'    },
    { path: '/empresas',  icon: <Building2 size={22} />,    label: 'Empresas'  },
    { path: '/proyectos', icon: <FolderKanban size={22} />, label: 'Proyectos' },
    { path: '/finanzas',  icon: <Wallet size={22} />,       label: 'Finanzas'  },
    { path: '/deudas',    icon: <CreditCard size={22} />,   label: 'Deudas'    },
    { path: '/historial', icon: <History size={22} />,      label: 'Historial' },
  ];

  const [vencidas, setVencidas] = useState(0);

  useEffect(() => {
    const checkVencidas = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5000/api/tareas/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
        const hoyStr = new Date().toISOString().split('T')[0];
        const count = res.data.filter(t => t.fecha_asignada?.split('T')[0] < hoyStr).length;
        setVencidas(count);
      } catch (e) {}
    };
    checkVencidas();
    const interval = setInterval(checkVencidas, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  if (location.pathname === '/login' || location.pathname.includes('/enlace/')) return null;

  return (
    <div className="hidden md:flex flex-col w-64 h-full fixed top-0 left-0 bg-white border-r border-gray-100 p-6 z-50">
      <div className="flex items-center gap-2 mb-10 text-brand">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-8 h-8">
            <path d="M12 2L2 22L12 18L22 22L12 2Z" />
        </svg>
        <span className="text-xl font-black tracking-tight">VentasYA</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative
                ${isActive
                  ? 'bg-brand/10 text-brand font-bold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium'
                }`}
            >
              {item.path === '/' && vencidas > 0 && (
                <span className="absolute left-2.5 top-3 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
              )}
              {item.icon}
              <span className="text-sm">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-brand font-black uppercase">Administrador</p>
      </div>
    </div>
  );
};

export default Sidebar;
