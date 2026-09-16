import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalIcon, Search, LogOut, CheckCircle2, ChevronRight, AlertTriangle, PenSquare, Trash2, CalendarDays, TrendingUp, TrendingDown, Dumbbell, Clock } from 'lucide-react';
import WeekCalendar from '../components/WeekCalendar';
import MonthCalendar from '../components/MonthCalendar';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import GlobalSearchModal from '../components/GlobalSearchModal';
import QuickFinanzaModal from '../components/QuickFinanzaModal';
import AmortizarDeudaModal from '../components/AmortizarDeudaModal';
import ThemeToggle from '../components/ThemeToggle';
import RutinaModal from '../components/RutinaModal';

const Dashboard = () => {

    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
    const [tasks, setTasks] = useState([]);
    const [ingresosData, setIngresosData] = useState([]);
    const [egresosData, setEgresosData] = useState([]);
    const [deudasData, setDeudasData] = useState([]);
    const [totalDeuda, setTotalDeuda] = useState(0);
    const [totalEmpresas, setTotalEmpresas] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viendoRetrasados, setViendoRetrasados] = useState(false);
    const [showAmortizarDeuda, setShowAmortizarDeuda] = useState(null); // deuda seleccionada para amortizar
    
    // Modals
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [showCobroModal, setShowCobroModal] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [rutinasData, setRutinasData] = useState([]);
    const [showRutinaModal, setShowRutinaModal] = useState(false);
    const [sesionActivaModal, setSesionActivaModal] = useState(null);

    // KPIs calculados en tiempo real (se descuentan y actualizan inmediatamente)
    const kpiData = useMemo(() => {
        const ahora = new Date();
        // Incluir: vencidos (meses anteriores) + mes actual. Excluir: futuros.
        // Calculamos el último día del mes actual para no incluir meses futuros
        const finMesActual = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

        const ingPendBOB = ingresosData
            .filter(i => {
                const f = new Date(i.fecha_estimada);
                return i.estado !== 'pagado' && i.moneda !== 'USD' && f <= finMesActual;
            })
            .reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);

        const ingPendUSD = ingresosData
            .filter(i => {
                const f = new Date(i.fecha_estimada);
                return i.estado !== 'pagado' && i.moneda === 'USD' && f <= finMesActual;
            })
            .reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);

        const egPendientesMes = egresosData
            .filter(e => {
                const f = new Date(e.fecha_pago);
                return f <= finMesActual && e.estado !== 'pagado';
            })
            .reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);

        return {
            ingresosBOB: ingPendBOB,
            ingresosUSD: ingPendUSD,
            egresosPendientes: egPendientesMes,
            deuda: totalDeuda,
            totalEmpresas: totalEmpresas,
        };

    }, [ingresosData, egresosData, totalDeuda, totalEmpresas]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch each resource independently so one failure doesn't blank the whole dashboard
        const [tarRes, finRes, deuRes, egRes, empRes] = await Promise.allSettled([
            axios.get('/api/tareas/dashboard', { headers }),
            axios.get('/api/finanzas/ingresos', { headers }),
            axios.get('/api/deudas?estado=activa', { headers }),
            axios.get('/api/finanzas/egresos', { headers }),
            axios.get('/api/empresas', { headers })
        ]);

        if (tarRes.status === 'fulfilled') setTasks(tarRes.value.data);
        else console.error('Error tareas:', tarRes.reason);

        if (finRes.status === 'fulfilled') setIngresosData(finRes.value.data);
        else console.error('Error ingresos:', finRes.reason);

        if (deuRes.status === 'fulfilled') {
            const deudas = deuRes.value.data;
            setDeudasData(deudas);
            setTotalDeuda(deudas.reduce((acc, curr) => acc + parseFloat(curr.monto_total || 0), 0));
        } else console.error('Error deudas:', deuRes.reason);

        if (egRes.status === 'fulfilled') setEgresosData(egRes.value.data);
        else console.error('Error egresos:', egRes.reason);

        if (empRes.status === 'fulfilled') setTotalEmpresas(empRes.value.data.length);
        else console.error('Error empresas:', empRes.reason);

        // Fetch rutinas (todas las recientes + auto-crea días de la semana actual)
        const ahoraLocal = new Date();
        const hoyLocalStr = `${ahoraLocal.getFullYear()}-${String(ahoraLocal.getMonth()+1).padStart(2,'0')}-${String(ahoraLocal.getDate()).padStart(2,'0')}`;
        try {
            const rutRes = await axios.get(`/api/rutina?fecha=${hoyLocalStr}`, { headers });
            if (rutRes.data?.todas) {
                setRutinasData(rutRes.data.todas);
            }
        } catch (e) { console.error('Error rutina:', e); }

        setLoading(false);
    };

    const handleMarcarGym = async (id, fechaStr) => {
        const token = localStorage.getItem('token');
        if (id) {
            setRutinasData(prev => prev.map(r => r.id === id ? { ...r, estado: 'gym' } : r));
            try {
                const res = await axios.patch(`/api/rutina/${id}/gym`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRutinasData(prev => prev.map(r => r.id === id ? res.data : r));
            } catch (e) {
                console.error('Error al marcar gym:', e);
                fetchData();
            }
        } else if (fechaStr) {
            try {
                const rutRes = await axios.get(`/api/rutina?fecha=${fechaStr}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const rec = rutRes.data?.todas?.find(r => r.fecha_str === fechaStr);
                if (rec) {
                    const res = await axios.patch(`/api/rutina/${rec.id}/gym`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setRutinasData(prev => [...prev.filter(r => r.id !== rec.id), res.data]);
                }
            } catch (e) {
                console.error('Error al marcar gym fallback:', e);
                fetchData();
            }
        }
    };

    const handleAbrirRutinaModal = async (sesion) => {
        if (sesion.id) {
            setSesionActivaModal(sesion);
            setShowRutinaModal(true);
        } else {
            const token = localStorage.getItem('token');
            try {
                const rutRes = await axios.get(`/api/rutina?fecha=${sesion.fecha_str}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const rec = rutRes.data?.todas?.find(r => r.fecha_str === sesion.fecha_str);
                if (rec) {
                    setRutinasData(prev => [...prev.filter(r => r.id !== rec.id), rec]);
                    setSesionActivaModal(rec);
                    setShowRutinaModal(true);
                }
            } catch (e) {
                console.error('Error abriendo rutina modal:', e);
            }
        }
    };



    useEffect(() => { fetchData(); }, []);
    useEffect(() => { setViendoRetrasados(false); }, [selectedDate]);

    const handleCumplir = async (id) => {
        // Guardar snapshot para rollback
        const snapshot = tasks.find(t => t.id === id);
        // Actualización optimista: quitar de la lista (el backend solo devuelve pendientes)
        setTasks(prev => prev.filter(t => t.id !== id));
        const token = localStorage.getItem('token');
        try {
            await axios.patch(`/api/tareas/${id}/estado`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error(error);
            // Revertir: devolver la tarea a la lista si falla
            if (snapshot) setTasks(prev => [...prev, snapshot].sort((a, b) => new Date(a.fecha_asignada) - new Date(b.fecha_asignada)));
        }
    };


    const handleEliminar = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;
        // Actualización optimista: quitar de la lista inmediatamente
        setTasks(prev => prev.filter(t => t.id !== id));
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`/api/tareas/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error(error);
            fetchData(); // Revertir recargando si falla
        }
    };

    const handleLogout = () => {
        if (!window.confirm("¿Cerrar sesión?")) return;
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Cálculos derivados
    // ✅ FIX TIMEZONE: hoyStr en hora LOCAL para evitar que a las 9pm cambie de día
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    const selectDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
    const tareasDelDia = tasks.filter(t => t.fecha_asignada?.split('T')[0] === selectDateStr);
    const ingresosDelDia = ingresosData.filter(i => i.fecha_estimada?.split('T')[0] === selectDateStr && i.estado !== 'pagado');
    const egresosDelDia = egresosData.filter(e => e.fecha_pago?.split('T')[0] === selectDateStr && e.estado !== 'pagado');


    const actividadesDelDia = [
        ...tareasDelDia.map(t => ({ ...t, tipoItem: 'tarea' })),
        ...ingresosDelDia.map(i => ({ ...i, tipoItem: 'ingreso' })),
        ...egresosDelDia.map(e => ({ ...e, tipoItem: 'egreso' }))
    ];

    // Helper: cuántos días de retraso tiene un item
    const diasRetraso = (fechaStr) => {
        const fecha = new Date(fechaStr.split('T')[0] + 'T00:00:00');
        const hoyD = new Date(hoyStr + 'T00:00:00');
        return Math.floor((hoyD - fecha) / (1000 * 60 * 60 * 24));
    };

    // Formatear hora (ej: "10:00" -> "10:00 AM", "22:00" -> "10:00 PM")
    const formatearHora = (horaStr) => {
        if (!horaStr) return '';
        const [h, m] = horaStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return horaStr;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    // Comparador: tareas con hora salen arriba ordenadas por hora, luego las sin hora
    const ordenarPorHora = (a, b) => {
        const horaA = a.hora;
        const horaB = b.hora;
        if (horaA && horaB) return horaA.localeCompare(horaB);
        if (horaA && !horaB) return -1;
        if (!horaA && horaB) return 1;
        return 0;
    };
    
    const hoyStr2 = hoyStr; // alias para uso en lambdas
    const tareasVencidas = tasks.filter(t => t.fecha_asignada?.split('T')[0] < hoyStr);
    const ingresosVencidos = ingresosData.filter(i => (i.fecha_estimada?.split('T')[0] < hoyStr) && i.estado !== 'pagado');
    const egresosVencidos = egresosData.filter(e => (e.fecha_pago?.split('T')[0] < hoyStr) && e.estado !== 'pagado');
    
    // Rutinas retrasadas (días anteriores a hoy que quedaron pendientes)
    const rutinasRetrasadas = rutinasData.filter(r => r.fecha_str < hoyStr && r.estado === 'pendiente');

    // Sesión de ejercicio del día seleccionado en el calendario (Lunes a Sábado)
    const [sy, sm, sd] = selectDateStr.split('-').map(Number);
    const esDomingoSeleccionado = new Date(sy, sm - 1, sd).getDay() === 0;
    const sesionDiaSeleccionado = !esDomingoSeleccionado 
        ? (rutinasData.find(r => r.fecha_str === selectDateStr) || {
            id: null,
            fecha_str: selectDateStr,
            estado: 'pendiente',
            ejercicios_completados: {},
            isFallback: true
        })
        : null;

    const totalRetrasos = tareasVencidas.length + ingresosVencidos.length + egresosVencidos.length + rutinasRetrasadas.length;

    const listaAMostrar = viendoRetrasados ? [
        ...tareasVencidas.map(t => ({ ...t, tipoItem: 'tarea' })).sort(ordenarPorHora),
        ...ingresosVencidos.map(i => ({ ...i, tipoItem: 'ingreso' })),
        ...egresosVencidos.map(e => ({ ...e, tipoItem: 'egreso' }))
    ] : [
        ...tareasDelDia.map(t => ({ ...t, tipoItem: 'tarea' })).sort(ordenarPorHora),
        ...ingresosDelDia.map(i => ({ ...i, tipoItem: 'ingreso' })),
        ...egresosDelDia.map(e => ({ ...e, tipoItem: 'egreso' }))
    ];

    // Agrupar retrasadas por proyecto (tareas con hora arriba)
    const retrasadasPorProyecto = (() => {
        if (!viendoRetrasados) return {};
        const grupos = {};
        tareasVencidas.forEach(t => {
            const key = t.proyecto_id ? `proy_${t.proyecto_id}` : '__propias__';
            const label = t.proyecto_nombre
                ? `${t.empresa_nombre ? t.empresa_nombre + ': ' : ''}${t.proyecto_nombre}`
                : 'Propias / Sin Proyecto';
            if (!grupos[key]) grupos[key] = { label, items: [] };
            grupos[key].items.push({ ...t, tipoItem: 'tarea' });
        });
        const finItems = [
            ...ingresosVencidos.map(i => ({ ...i, tipoItem: 'ingreso' })),
            ...egresosVencidos.map(e => ({ ...e, tipoItem: 'egreso' }))
        ];
        if (finItems.length > 0) grupos['__finanzas__'] = { label: 'Cobros y Pagos Vencidos', items: finItems };

        // Ordenar cada grupo: tareas con hora arriba
        Object.keys(grupos).forEach(k => {
            if (k !== '__finanzas__') {
                grupos[k].items.sort(ordenarPorHora);
            }
        });
        return grupos;
    })();

    // Agrupar actividades del día por proyecto (tareas con hora arriba)
    const actividadesDelDiaPorGrupo = (() => {
        if (viendoRetrasados) return {};
        const grupos = {};
        tareasDelDia.forEach(t => {
            const key = t.proyecto_id ? `proy_${t.proyecto_id}` : '__propias__';
            const label = t.proyecto_nombre
                ? `${t.empresa_nombre ? t.empresa_nombre + ': ' : ''}${t.proyecto_nombre}`
                : 'Propias / Sin Proyecto';
            if (!grupos[key]) grupos[key] = { label, items: [] };
            grupos[key].items.push({ ...t, tipoItem: 'tarea' });
        });
        const finItems = [
            ...ingresosDelDia.map(i => ({ ...i, tipoItem: 'ingreso' })),
            ...egresosDelDia.map(e => ({ ...e, tipoItem: 'egreso' }))
        ];
        if (finItems.length > 0) grupos['__finanzas__'] = { label: 'Cobros y Pagos del Día', items: finItems };

        // Ordenar cada grupo: tareas con hora arriba
        Object.keys(grupos).forEach(k => {
            if (k !== '__finanzas__') {
                grupos[k].items.sort(ordenarPorHora);
            }
        });
        return grupos;
    })();


    const handleToggleFinanza = async (id, tipo) => {
        const token = localStorage.getItem('token');
        const toggle = (item) => ({ ...item, estado: item.estado === 'pagado' ? 'pendiente' : 'pagado' });
        // Actualización optimista
        if (tipo === 'ingreso') {
            setIngresosData(prev => prev.map(i => i.id === id ? toggle(i) : i));
        } else {
            setEgresosData(prev => prev.map(e => e.id === id ? toggle(e) : e));
        }
        try {
            await axios.patch(`/api/finanzas/${tipo}s/${id}/estado`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error(error);
            // Revertir si falla
            if (tipo === 'ingreso') {
                setIngresosData(prev => prev.map(i => i.id === id ? toggle(i) : i));
            } else {
                setEgresosData(prev => prev.map(e => e.id === id ? toggle(e) : e));
            }
        }
    };

    const handleEliminarFinanza = async (id, tipo) => {
        const label = tipo === 'ingreso' ? 'cobro' : 'pago';
        if (!window.confirm(`¿Eliminar este ${label}? Esta acción no se puede deshacer.`)) return;
        // Optimista
        if (tipo === 'ingreso') {
            setIngresosData(prev => prev.filter(i => i.id !== id));
        } else {
            setEgresosData(prev => prev.filter(e => e.id !== id));
        }
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/finanzas/${tipo}s/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            console.error(err);
            alert('No se pudo eliminar. Recarga la página.');
            fetchData();
        }
    };

    // Mapeo para los puntitos del calendario mensual
    const tareasPorDia = useMemo(() => {
        const map = {};
        tasks.forEach(t => {
            const d = t.fecha_asignada?.split('T')[0];
            if (d) map[d] = (map[d] || 0) + 1;
        });
        return map;
    }, [tasks]);




    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200">
            {/* Header con mini-stats */}
            <div className="flex justify-between items-start mb-6 pt-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Hola, Admin 👋</h1>
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-400 capitalize">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    {/* Mini-stats bajo el saludo */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-3 py-1.5 shadow-sm">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Empresas</span>
                            <span className="text-sm font-black text-gray-800 dark:text-gray-100">{kpiData.totalEmpresas}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-950/40 rounded-2xl px-3 py-1.5 shadow-sm">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Deuda</span>
                            <span className="text-sm font-black text-red-500">Bs. {kpiData.deuda.toFixed(0)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle size={20} />
                    <button onClick={() => setShowSearch(true)} className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-brand shadow-sm active:scale-95 transition-transform" title="Buscar">
                        <Search size={22} />
                    </button>
                    <button onClick={handleLogout} className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-full text-red-500 dark:text-red-400 shadow-sm active:scale-95 transition-transform" title="Cerrar sesión">
                        <LogOut size={22} />
                    </button>
                </div>
            </div>

            {/* Alerta de Retrasos Mixtos */}
            {totalRetrasos > 0 && (
                <div 
                    onClick={() => setViendoRetrasados(true)}
                    className="mb-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 hover:shadow-md transition-all active:scale-[0.99]"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500 p-2 rounded-xl text-white shadow-md">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-red-800 dark:text-red-200 font-bold text-sm">¡Tienes retrasos detectados!</p>
                            <p className="text-red-500 dark:text-red-400 text-xs mt-0.5 font-medium">
                                {[
                                    tareasVencidas.length > 0 && `${tareasVencidas.length} tareas`,
                                    ingresosVencidos.length > 0 && `${ingresosVencidos.length} cobros`,
                                    egresosVencidos.length > 0 && `${egresosVencidos.length} pagos`,
                                    rutinasRetrasadas.length > 0 && `${rutinasRetrasadas.length} ejercicio${rutinasRetrasadas.length !== 1 ? 's' : ''}`
                                ].filter(Boolean).join(', ')} pendientes.
                            </p>
                        </div>
                    </div>
                    <div className="text-red-400">
                        <ChevronRight size={24} />
                    </div>
                </div>
            )}

            {/* KPIs Cards — 3 datos + 3 acciones rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Por Cobrar</p>
                    <p className="text-xl font-black mt-1 text-green-500">
                        Bs. {kpiData.ingresosBOB.toFixed(0)}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Por Cobrar</p>
                    <p className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
                        $ {kpiData.ingresosUSD.toFixed(0)}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Por Pagar</p>
                    <p className="text-xl font-black mt-1 text-red-500">
                        Bs. {kpiData.egresosPendientes.toFixed(0)}
                    </p>
                </div>
                {/* Cobro Rápido */}
                <div
                    onClick={() => setShowCobroModal(true)}
                    className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-green-100 dark:border-green-900/40 shadow-sm flex flex-col justify-center items-center bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-green-950/30 dark:to-emerald-950/10 cursor-pointer hover:shadow-md transition-all active:scale-95"
                >
                    <TrendingUp size={22} className="text-green-500 mb-1" />
                    <span className="text-sm font-black text-green-600 dark:text-green-400 text-center leading-tight">Cobro Rápido</span>
                    <span className="text-[10px] text-green-400 font-bold mt-0.5">+ Registrar</span>
                </div>
                {/* Pago Rápido */}
                <div
                    onClick={() => setShowPagoModal(true)}
                    className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-red-100 dark:border-red-900/40 shadow-sm flex flex-col justify-center items-center bg-gradient-to-br from-red-50 to-rose-50/30 dark:from-red-950/30 dark:to-rose-950/10 cursor-pointer hover:shadow-md transition-all active:scale-95"
                >
                    <TrendingDown size={22} className="text-red-400 mb-1" />
                    <span className="text-sm font-black text-red-500 dark:text-red-400 text-center leading-tight">Pago Rápido</span>
                    <span className="text-[10px] text-red-300 dark:text-red-400 font-bold mt-0.5">+ Registrar</span>
                </div>
                {/* Añadir Tarea */}
                <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center items-center bg-gradient-to-br from-brand/10 to-brand/5 dark:from-brand/20 dark:to-brand/10 cursor-pointer hover:shadow-md transition-all active:scale-95" onClick={() => setShowTaskModal(true)}>
                    <div className="flex flex-col items-center gap-1 font-black text-brand">
                        <span className="text-sm">Añadir Tarea</span>
                        <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"><ChevronRight size={16} /></div>
                    </div>
                </div>
            </div>

            {/* Calendario con Toggle M/W */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="text-base font-black text-gray-800 dark:text-gray-100">Calendario</h2>
                    <button 
                        onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand bg-orange-50 dark:bg-brand/20 px-3 py-1.5 rounded-full"
                    >
                        <CalendarDays size={14} /> {viewMode === 'week' ? 'Ver Mes' : 'Ver Semana'}
                    </button>
                </div>

                {viewMode === 'week' ? (
                    <WeekCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                ) : (
                    <MonthCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} tareasPorDia={tareasPorDia} />
                )}
            </div>

            {/* Lista de Actividades del día seleccionado o Retrasos */}
            <div>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h2 className={`text-base font-black ${viendoRetrasados ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {viendoRetrasados 
                            ? `Actividades Retrasadas (${listaAMostrar.length + rutinasRetrasadas.length})` 
                            : `Actividades del día (${listaAMostrar.length + (!esDomingoSeleccionado ? 1 : 0)})`}
                    </h2>
                    {viendoRetrasados && (
                        <button 
                            onClick={() => setViendoRetrasados(false)}
                            className="text-[10px] font-bold text-gray-500 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full uppercase hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            Ver mi día
                        </button>
                    )}
                </div>
                {loading ? (
                    <div className="text-center py-10 text-gray-400 font-medium">Actualizando...</div>
                ) : viendoRetrasados ? (
                    // ── VISTA AGRUPADA POR PROYECTO ──
                    Object.keys(retrasadasPorProyecto).length === 0 && rutinasRetrasadas.length === 0 ? (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 flex flex-col items-center shadow-sm text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-green-50 dark:bg-green-950/40 text-green-400"><CheckCircle2 size={24} /></div>
                            <p className="font-bold text-gray-500 dark:text-gray-300 text-sm">¡Todo al día!</p>
                            <p className="text-xs text-gray-400 mt-1">No tienes ninguna obligación retrasada.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Rutinas retrasadas (días pasados no completados) */}
                            {rutinasRetrasadas.map(rut => {
                                const [ry, rm, rd] = rut.fecha_str.split('-').map(Number);
                                const fObj = new Date(ry, rm - 1, rd);
                                const fLabel = fObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
                                const dias = diasRetraso(rut.fecha_str);

                                return (
                                    <div key={`rutina-retrasada-${rut.id}`} className="rounded-3xl border p-4 shadow-sm bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-900/40">
                                                    <Dumbbell size={22} className="text-orange-500" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-gray-800 dark:text-gray-100 text-sm">💪 Ejercicio Diario</p>
                                                        <span className="text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">
                                                            ⏰ {dias > 0 ? `${dias} día${dias !== 1 ? 's' : ''} de retraso` : 'Retrasado'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold mt-0.5 text-orange-500 capitalize">
                                                        📅 {fLabel} — ⏳ Pendiente
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleMarcarGym(rut.id, rut.fecha_str)}
                                                className="flex-1 py-2.5 rounded-2xl bg-green-500 text-white font-black text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-green-200 dark:shadow-green-900/30"
                                            >
                                                🏋️ Fui al Gym
                                            </button>
                                            <button
                                                onClick={() => handleAbrirRutinaModal(rut)}
                                                className="flex-1 py-2.5 rounded-2xl bg-orange-500 text-white font-black text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-orange-200 dark:shadow-orange-900/30"
                                            >
                                                🏠 Rutina en Casa
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.entries(retrasadasPorProyecto).map(([key, grupo]) => (
                                <div key={key}>
                                    {/* Cabecera del grupo */}
                                    <div className={`flex items-center gap-2 mb-3 px-1`}>
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                                            key === '__finanzas__' ? 'bg-green-500' :
                                            key === '__propias__' ? 'bg-gray-400' : 'bg-brand'
                                        }`} />
                                        <p className={`text-xs font-black uppercase tracking-widest truncate ${
                                            key === '__finanzas__' ? 'text-green-600 dark:text-green-400' :
                                            key === '__propias__' ? 'text-gray-500 dark:text-gray-400' : 'text-brand'
                                        }`}>
                                            {grupo.label}
                                        </p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                            key === '__finanzas__' ? 'bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400' :
                                            key === '__propias__' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300' : 'bg-orange-100 dark:bg-brand/20 text-brand'
                                        }`}>
                                            {grupo.items.length}
                                        </span>
                                    </div>

                                    {/* Tarjetas del grupo */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {grupo.items.map(actItem => {
                                            const isTarea = actItem.tipoItem === 'tarea';
                                            const isIngreso = actItem.tipoItem === 'ingreso';
                                            const isPagado = actItem.estado === 'pagado';
                                            const fechaRef = isTarea ? actItem.fecha_asignada : (isIngreso ? actItem.fecha_estimada : actItem.fecha_pago);
                                            const isVencida = fechaRef?.split('T')[0] < hoyStr && !isPagado;
                                            const dias = diasRetraso(fechaRef);

                                            return (
                                                <div key={`${actItem.tipoItem}-${actItem.id}`} className={`bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden flex gap-4 items-center transition-all ${isPagado ? 'opacity-60 bg-gray-50 dark:bg-gray-800/40' : ''}`}>
                                                    {isVencida && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />}

                                                    <button
                                                        onClick={() => isTarea ? handleCumplir(actItem.id) : handleToggleFinanza(actItem.id, actItem.tipoItem)}
                                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isPagado ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : isTarea ? 'border-2 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 hover:border-brand hover:text-brand' : isIngreso ? 'bg-green-50 dark:bg-green-950/40 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/40' : 'bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
                                                    >
                                                        {isPagado ? <CheckCircle2 size={24} /> : isTarea ? <CheckCircle2 size={24} /> : isIngreso ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                                    </button>

                                                    <div className={`flex-1 min-w-0 py-1 ${isPagado ? 'line-through text-gray-400' : ''}`}>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {isTarea && actItem.hora && (
                                                                <span className="text-[11px] font-black bg-brand/10 dark:bg-brand/25 text-brand px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                                                                    <Clock size={12} /> {formatearHora(actItem.hora)}
                                                                </span>
                                                            )}
                                                            <p className={`font-bold leading-tight truncate text-sm ${isVencida ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                                                {isTarea ? actItem.titulo : isIngreso ? `Cobro: ${actItem.empresa_nombre || actItem.observacion || 'Cobro rápido'}` : `Pago: ${actItem.observacion || 'Pago rápido'}`}
                                                            </p>
                                                        </div>
                                                        {isTarea && actItem.observacion && (
                                                            <p className="text-[11px] italic text-gray-400 mt-0.5 line-clamp-1">{actItem.observacion}</p>
                                                        )}
                                                        <div className="flex flex-wrap gap-1 mt-1 items-center">
                                                            {dias > 0 && isVencida && (
                                                                <span className="text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">
                                                                    ⏰ {dias} día{dias !== 1 ? 's' : ''} de retraso
                                                                </span>
                                                            )}
                                                            {!isTarea && (
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isIngreso ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'}`}>
                                                                    {actItem.moneda === 'USD' ? '$' : 'Bs.'} {actItem.monto}
                                                                </span>
                                                            )}
                                                            {/* Fecha */}
                                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                                                                {new Date(fechaRef).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isTarea ? (
                                                        <div className="flex flex-col gap-1 shrink-0">
                                                            <button onClick={() => setEditTask(actItem)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"><PenSquare size={16} /></button>
                                                            <button onClick={() => handleEliminar(actItem.id)} className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-500 dark:text-red-400 active:bg-red-200 dark:active:bg-red-900/60 transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1 shrink-0">
                                                            <button onClick={() => handleEliminarFinanza(actItem.id, actItem.tipoItem)} className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-400 dark:text-red-400 active:bg-red-200 dark:active:bg-red-900/60 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                                                        </div>
                                                    )}

                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : Object.keys(actividadesDelDiaPorGrupo).length > 0 || sesionDiaSeleccionado ? (
                    // ── VISTA AGRUPADA POR PROYECTO (DÍA) ──
                    <div className="space-y-6">
                        {/* Tarjeta Ejercicio Diario — día seleccionado en el calendario (Lunes a Sábado) */}
                        {sesionDiaSeleccionado && (
                            <div className={`rounded-3xl border p-4 shadow-sm transition-all ${
                                sesionDiaSeleccionado.estado === 'pendiente'
                                    ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50'
                                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-2xl ${sesionDiaSeleccionado.estado === 'pendiente' ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-green-100 dark:bg-green-900/40'}`}>
                                            <Dumbbell size={22} className={sesionDiaSeleccionado.estado === 'pendiente' ? 'text-orange-500' : 'text-green-500'} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-800 dark:text-gray-100 text-sm">💪 Ejercicio Diario</p>
                                            <p className={`text-xs font-bold mt-0.5 ${sesionDiaSeleccionado.estado === 'pendiente' ? 'text-orange-500' : 'text-green-500'}`}>
                                                {sesionDiaSeleccionado.estado === 'pendiente' && (selectDateStr === hoyStr ? '⏳ Pendiente hoy' : '⏳ Pendiente')}
                                                {sesionDiaSeleccionado.estado === 'gym' && '🏋️ ¡Fuiste al gym! Completado'}
                                                {sesionDiaSeleccionado.estado === 'rutina' && '🏠 ¡Rutina completa! Completado'}
                                            </p>
                                        </div>
                                    </div>
                                    {sesionDiaSeleccionado.estado !== 'pendiente' && (
                                        <CheckCircle2 size={28} className="text-green-500" />
                                    )}
                                </div>
                                {sesionDiaSeleccionado.estado === 'pendiente' && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleMarcarGym(sesionDiaSeleccionado.id, sesionDiaSeleccionado.fecha_str)}
                                            className="flex-1 py-2.5 rounded-2xl bg-green-500 text-white font-black text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-green-200 dark:shadow-green-900/30"
                                        >
                                            🏋️ Fui al Gym
                                        </button>
                                        <button
                                            onClick={() => handleAbrirRutinaModal(sesionDiaSeleccionado)}
                                            className="flex-1 py-2.5 rounded-2xl bg-orange-500 text-white font-black text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-orange-200 dark:shadow-orange-900/30"
                                        >
                                            🏠 Rutina en Casa
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {Object.entries(actividadesDelDiaPorGrupo).map(([key, grupo]) => (
                            <div key={key}>
                                {/* Cabecera del grupo */}
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        key === '__finanzas__' ? 'bg-green-500' :
                                        key === '__propias__' ? 'bg-gray-400' : 'bg-brand'
                                    }`} />
                                    <p className={`text-xs font-black uppercase tracking-widest truncate ${
                                        key === '__finanzas__' ? 'text-green-600 dark:text-green-400' :
                                        key === '__propias__' ? 'text-gray-500 dark:text-gray-400' : 'text-brand'
                                    }`}>
                                        {grupo.label}
                                    </p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        key === '__finanzas__' ? 'bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400' :
                                        key === '__propias__' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300' : 'bg-orange-100 dark:bg-brand/20 text-brand'
                                    }`}>
                                        {grupo.items.length}
                                    </span>
                                </div>

                                {/* Tarjetas del grupo */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {grupo.items.map(actItem => {
                                        const isTarea = actItem.tipoItem === 'tarea';
                                        const isIngreso = actItem.tipoItem === 'ingreso';
                                        const isPagado = actItem.estado === 'pagado';
                                        const fechaRef = isTarea ? actItem.fecha_asignada : (isIngreso ? actItem.fecha_estimada : actItem.fecha_pago);
                                        const isVencida = fechaRef?.split('T')[0] < hoyStr && !isPagado;

                                        return (
                                            <div key={`${actItem.tipoItem}-${actItem.id}`} className={`bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden flex gap-4 items-center transition-all ${isPagado ? 'opacity-60 bg-gray-50 dark:bg-gray-800/40' : ''}`}>
                                                {isVencida && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />}

                                                <button
                                                    onClick={() => isTarea ? handleCumplir(actItem.id) : handleToggleFinanza(actItem.id, actItem.tipoItem)}
                                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isPagado ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : isTarea ? 'border-2 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 hover:border-brand hover:text-brand' : isIngreso ? 'bg-green-50 dark:bg-green-950/40 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/40' : 'bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
                                                >
                                                    {isPagado ? <CheckCircle2 size={24} /> : isTarea ? <CheckCircle2 size={24} /> : isIngreso ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                                </button>

                                                <div className={`flex-1 min-w-0 py-1 ${isPagado ? 'line-through text-gray-400' : ''}`}>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {isTarea && actItem.hora && (
                                                            <span className="text-[11px] font-black bg-brand/10 dark:bg-brand/25 text-brand px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                                                                <Clock size={12} /> {formatearHora(actItem.hora)}
                                                            </span>
                                                        )}
                                                        <p className={`font-bold leading-tight truncate text-sm ${isVencida ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                                            {isTarea ? actItem.titulo : isIngreso ? `Cobro: ${actItem.empresa_nombre || actItem.observacion || 'Cobro rápido'}` : `Pago: ${actItem.observacion || 'Pago rápido'}`}
                                                        </p>
                                                    </div>
                                                    {isTarea && actItem.observacion && (
                                                        <p className="text-[11px] italic text-gray-400 mt-0.5 line-clamp-1">{actItem.observacion}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-1 mt-1 items-center">
                                                        {isVencida && diasRetraso(fechaRef) > 0 && (
                                                            <span className="text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">
                                                                ⏰ {diasRetraso(fechaRef)} día{diasRetraso(fechaRef) !== 1 ? 's' : ''} de retraso
                                                            </span>
                                                        )}
                                                        {!isTarea && (
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isIngreso ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'}`}>
                                                                {actItem.moneda === 'USD' ? '$' : 'Bs.'} {actItem.monto}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isTarea ? (
                                                    <div className="flex flex-col gap-1 shrink-0">
                                                        <button onClick={() => setEditTask(actItem)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"><PenSquare size={16} /></button>
                                                        <button onClick={() => handleEliminar(actItem.id)} className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-500 dark:text-red-400 active:bg-red-200 dark:active:bg-red-900/60 transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1 shrink-0">
                                                        <button onClick={() => handleEliminarFinanza(actItem.id, actItem.tipoItem)} className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-400 dark:text-red-400 active:bg-red-200 dark:active:bg-red-900/60 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 flex flex-col items-center shadow-sm text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${viendoRetrasados ? 'bg-red-50 dark:bg-red-950/40 text-red-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600'}`}>
                            {viendoRetrasados ? <CheckCircle2 size={24} /> : esDomingoSeleccionado ? <span className="text-3xl">🛌</span> : <CalIcon size={24} />}
                        </div>
                        <p className="font-bold text-gray-500 dark:text-gray-300 text-sm">
                            {viendoRetrasados ? '¡Todo al día!' : esDomingoSeleccionado ? 'Domingo — Día de Descanso' : 'El día está libre'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {viendoRetrasados ? 'No tienes ninguna obligación retrasada.' : esDomingoSeleccionado ? 'Día de recuperación muscular libre de rutina obligatoria. ¡A recargar energías!' : 'Disfruta tu descanso o añade nuevas actividades.'}
                        </p>
                    </div>
                )}
            </div>

            {/* ──── Sección Deudas Activas ──── */}
            {deudasData.length > 0 && (
                <div className="mt-4 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Deudas Activas</h3>
                    {deudasData.map(deuda => (
                        <div key={deuda.id} className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-orange-100 dark:border-orange-950/40 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                                <span className="text-orange-500 font-black text-lg">D</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{deuda.concepto}</p>
                                {deuda.empresa_nombre && <p className="text-xs text-brand truncate">{deuda.empresa_nombre}</p>}
                                <span className="text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md inline-block mt-1">
                                    Pendiente: Bs. {parseFloat(deuda.monto_total).toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowAmortizarDeuda(deuda)}
                                className="bg-brand text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0 active:scale-95 transition-all"
                            >
                                Amortizar
                            </button>
                        </div>
                    ))}
                </div>
            )}


            {/* Modal amortizar deuda desde Dashboard */}
            {showAmortizarDeuda && (
                <AmortizarDeudaModal
                    deuda={showAmortizarDeuda}
                    onClose={() => setShowAmortizarDeuda(null)}
                    onSaved={(deudaActualizada) => {
                        setShowAmortizarDeuda(null);
                        if (deudaActualizada.estado === 'completada') {
                            // Quitar de la lista inmediatamente
                            setDeudasData(prev => prev.filter(d => d.id !== deudaActualizada.id));
                            setTotalDeuda(prev => Math.max(0, prev - parseFloat(deudaActualizada.monto_total || 0)));
                        } else {
                            // Actualizar monto
                            setDeudasData(prev => prev.map(d => d.id === deudaActualizada.id ? { ...d, monto_total: deudaActualizada.monto_total } : d));
                            setTotalDeuda(prev => prev - (parseFloat(showAmortizarDeuda.monto_total) - parseFloat(deudaActualizada.monto_total)));
                        }
                    }}
                />
            )}

            {/* Modals */}
            {showTaskModal && (
                <AddTaskModal selectedDate={selectedDate} onClose={() => setShowTaskModal(false)} onSaved={() => { setShowTaskModal(false); fetchData(); }} />
            )}
            {editTask && (
                <EditTaskModal tarea={editTask} onClose={() => setEditTask(null)} onSaved={() => { setEditTask(null); fetchData(); }} />
            )}
            {showSearch && (
                <GlobalSearchModal onClose={() => setShowSearch(false)} />
            )}
            {showCobroModal && (
                <QuickFinanzaModal
                    tipo="ingreso"
                    selectedDate={selectedDate}
                    onClose={() => setShowCobroModal(false)}
                    onSaved={(nuevoItem) => {
                        setShowCobroModal(false);
                        setIngresosData(prev => [...prev, nuevoItem]);
                    }}
                />
            )}
            {showPagoModal && (
                <QuickFinanzaModal
                    tipo="egreso"
                    selectedDate={selectedDate}
                    onClose={() => setShowPagoModal(false)}
                    onSaved={(nuevoItem) => {
                        setShowPagoModal(false);
                        setEgresosData(prev => [...prev, nuevoItem]);
                    }}
                />
            )}
            {showRutinaModal && sesionActivaModal && (
                <RutinaModal
                    sesion={sesionActivaModal}
                    onClose={() => {
                        setShowRutinaModal(false);
                        setSesionActivaModal(null);
                    }}
                    onComplete={() => {
                        setRutinasData(prev => prev.map(r => r.id === sesionActivaModal.id ? { ...r, estado: 'rutina' } : r));
                        setShowRutinaModal(false);
                        setSesionActivaModal(null);
                    }}
                />
            )}

        </div>
    );
};

export default Dashboard;