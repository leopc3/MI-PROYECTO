import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, Building2, FolderKanban, Wallet, History, CreditCard } from 'lucide-react';

const BottomNav = () => {
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
    const interval = setInterval(checkVencidas, 60000); // 1 minuto update
    return () => clearInterval(interval);
  }, [location.pathname]);

  // No mostrar el menú en login ni en la vista del cliente
  if (location.pathname === '/login' || location.pathname.includes('/enlace/')) return null;

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around pb-safe pt-1.5 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center px-1 py-1.5 rounded-xl transition-all min-w-0 relative
              ${isActive
                ? 'text-brand'
                : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {item.path === '/' && vencidas > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
            {item.icon}
            <span className={`text-[9px] mt-0.5 font-bold ${isActive ? 'text-brand' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;