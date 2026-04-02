import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalIcon, Search, LogOut, CheckCircle2, ChevronRight, AlertTriangle, PenSquare, Trash2, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';
import WeekCalendar from '../components/WeekCalendar';
import MonthCalendar from '../components/MonthCalendar';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import GlobalSearchModal from '../components/GlobalSearchModal';

const Dashboard = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
    const [tasks, setTasks] = useState([]);
    const [ingresosData, setIngresosData] = useState([]);
    const [egresosData, setEgresosData] = useState([]);
    const [kpiData, setKpiData] = useState({ ingresos: 0, egresos: 0, deuda: 0, ingresosPendientes: 0, egresosPendientes: 0 });
    const [loading, setLoading] = useState(true);
    const [viendoRetrasados, setViendoRetrasados] = useState(false);
    
    // Modals
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // Paralelizar llamados al backend para KPIs y tareas
            const [tarRes, finRes, deuRes] = await Promise.all([
                axios.get('http://localhost:5000/api/tareas/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/finanzas/ingresos', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/deudas', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            // También ocupo egresos para el balance
            const egRes = await axios.get('http://localhost:5000/api/finanzas/egresos', { headers: { 'Authorization': `Bearer ${token}` } });

            setTasks(tarRes.data);
            
            // Calcular KPIs
            const mesActual = new Date().getMonth();
            const añoActual = new Date().getFullYear();
            
            const ingMes = finRes.data
                .filter(i => new Date(i.fecha_estimada).getMonth() === mesActual && new Date(i.fecha_estimada).getFullYear() === añoActual)
                .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
                
            const egMes = egRes.data
                .filter(e => new Date(e.fecha_pago).getMonth() === mesActual && new Date(e.fecha_pago).getFullYear() === añoActual)
                .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
            
            const ingPendientesMes = finRes.data
                .filter(i => new Date(i.fecha_estimada).getMonth() === mesActual && new Date(i.fecha_estimada).getFullYear() === añoActual && i.estado !== 'pagado')
                .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

            const egPendientesMes = egRes.data
                .filter(e => new Date(e.fecha_pago).getMonth() === mesActual && new Date(e.fecha_pago).getFullYear() === añoActual && e.estado !== 'pagado')
                .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

            const deudaTotal = deuRes.data.reduce((acc, curr) => acc + parseFloat(curr.monto_total), 0);

            setIngresosData(finRes.data);
            setEgresosData(egRes.data);
            setKpiData({ 
                ingresos: ingMes, 
                egresos: egMes, 
                deuda: deudaTotal,
                ingresosPendientes: ingPendientesMes,
                egresosPendientes: egPendientesMes
            });
        } catch (error) { console.error('Error cargando el dashboard:', error); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { setViendoRetrasados(false); }, [selectedDate]);

    const handleCumplir = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await axios.patch(`http://localhost:5000/api/tareas/${id}/estado`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/tareas/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handleLogout = () => {
        if (!window.confirm("¿Cerrar sesión?")) return;
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Cálculos derivados
    const selectDateStr = selectedDate.toISOString().split('T')[0];
    const tareasDelDia = tasks.filter(t => t.fecha_asignada?.split('T')[0] === selectDateStr);
    const ingresosDelDia = ingresosData.filter(i => i.fecha_estimada?.split('T')[0] === selectDateStr);
    const egresosDelDia = egresosData.filter(e => e.fecha_pago?.split('T')[0] === selectDateStr);

    const actividadesDelDia = [
        ...tareasDelDia.map(t => ({ ...t, tipoItem: 'tarea' })),
        ...ingresosDelDia.map(i => ({ ...i, tipoItem: 'ingreso' })),
        ...egresosDelDia.map(e => ({ ...e, tipoItem: 'egreso' }))
    ];
    
    const hoyStr = new Date().toISOString().split('T')[0];
    const tareasVencidas = tasks.filter(t => t.fecha_asignada?.split('T')[0] < hoyStr);
    const ingresosVencidos = ingresosData.filter(i => (i.fecha_estimada?.split('T')[0] < hoyStr) && i.estado !== 'pagado');
    const egresosVencidos = egresosData.filter(e => (e.fecha_pago?.split('T')[0] < hoyStr) && e.estado !== 'pagado');
    
    const totalRetrasos = tareasVencidas.length + ingresosVencidos.length + egresosVencidos.length;

    const listaAMostrar = viendoRetrasados ? [
        ...tareasVencidas.map(t => ({ ...t, tipoItem: 'tarea' })),
        ...ingresosVencidos.map(i => ({ ...i, tipoItem: 'ingreso' })),
        ...egresosVencidos.map(e => ({ ...e, tipoItem: 'egreso' }))
    ] : actividadesDelDia;

    const handleToggleFinanza = async (id, tipo) => {
        try {
            await axios.patch(`http://localhost:5000/api/finanzas/${tipo}s/${id}/estado`);
            fetchData();
        } catch (error) { console.error(error); }
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

    const balance = kpiData.ingresos - kpiData.egresos;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            {/* Header Rediseñado */}
            <div className="flex justify-between items-center mb-6 pt-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Hola, Admin 👋</h1>
                    <p className="text-sm font-bold text-gray-400 capitalize">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSearch(true)} className="p-2.5 bg-white border border-gray-200 rounded-full text-brand shadow-sm active:scale-95 transition-transform">
                        <Search size={22} />
                    </button>
                    <button onClick={handleLogout} className="p-2.5 bg-red-50 border border-red-100 rounded-full text-red-500 shadow-sm active:scale-95 transition-transform">
                        <LogOut size={22} />
                    </button>
                </div>
            </div>

            {/* Alerta de Retrasos Mixtos */}
            {totalRetrasos > 0 && (
                <div 
                    onClick={() => setViendoRetrasados(true)}
                    className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-red-100 hover:shadow-md transition-all active:scale-[0.99]"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500 p-2 rounded-xl text-white shadow-md">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-red-800 font-bold text-sm">¡Tienes retrasos detectados!</p>
                            <p className="text-red-500 text-xs mt-0.5 font-medium">
                                {[
                                    tareasVencidas.length > 0 && `${tareasVencidas.length} tareas`,
                                    ingresosVencidos.length > 0 && `${ingresosVencidos.length} cobros`,
                                    egresosVencidos.length > 0 && `${egresosVencidos.length} pagos`
                                ].filter(Boolean).join(', ')} pendientes.
                            </p>
                        </div>
                    </div>
                    <div className="text-red-400">
                        <ChevronRight size={24} />
                    </div>
                </div>
            )}

            {/* KPIs Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Balance Mes</p>
                    <p className={`text-xl font-black mt-1 ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        Bs. {balance.toFixed(0)}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Por Cobrar</p>
                    <p className="text-xl font-black mt-1 text-green-500">
                        Bs. {kpiData.ingresosPendientes.toFixed(0)}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Por Pagar</p>
                    <p className="text-xl font-black mt-1 text-red-500">
                        Bs. {kpiData.egresosPendientes.toFixed(0)}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Tareas Pend.</p>
                    <p className="text-xl font-black mt-1 text-gray-800">{tasks.length}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Deuda Activa</p>
                    <p className="text-xl font-black mt-1 text-red-500">Bs. {kpiData.deuda.toFixed(0)}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center bg-gradient-to-br from-brand/10 to-brand/5 cursor-pointer hover:shadow-md transition-all active:scale-95" onClick={() => setShowTaskModal(true)}>
                    <div className="flex flex-col items-center gap-1 font-black text-brand">
                        <span className="text-sm">Añadir Tarea</span>
                        <div className="bg-white rounded-full p-1 shadow-sm"><ChevronRight size={16} /></div>
                    </div>
                </div>
            </div>

            {/* Calendario con Toggle M/W */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="text-base font-black text-gray-800">Calendario</h2>
                    <button 
                        onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand bg-orange-50 px-3 py-1.5 rounded-full"
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
                    <h2 className={`text-base font-black ${viendoRetrasados ? 'text-red-600' : 'text-gray-800'}`}>
                        {viendoRetrasados ? `Actividades Retrasadas (${listaAMostrar.length})` : `Actividades del día (${listaAMostrar.length})`}
                    </h2>
                    {viendoRetrasados && (
                        <button 
                            onClick={() => setViendoRetrasados(false)}
                            className="text-[10px] font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-full uppercase hover:bg-gray-300 transition-colors"
                        >
                            Ver mi día
                        </button>
                    )}
                </div>
                {loading ? (
                    <div className="text-center py-10 text-gray-400 font-medium">Actualizando...</div>
                ) : listaAMostrar.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listaAMostrar.map(actItem => {
                            const isTarea = actItem.tipoItem === 'tarea';
                            const isIngreso = actItem.tipoItem === 'ingreso';
                            const isPagado = actItem.estado === 'pagado';
                            const fechaRef = isTarea ? actItem.fecha_asignada : (isIngreso ? actItem.fecha_estimada : actItem.fecha_pago);
                            const isVencida = fechaRef?.split('T')[0] < hoyStr && !isPagado;

                            return (
                                <div key={`${actItem.tipoItem}-${actItem.id}`} className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex gap-4 items-center transition-all ${isPagado ? 'opacity-60 bg-gray-50' : ''}`}>
                                    {isVencida && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>}
                                    
                                    <button 
                                        onClick={() => isTarea ? handleCumplir(actItem.id) : handleToggleFinanza(actItem.id, actItem.tipoItem)}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isPagado ? 'bg-gray-200 text-gray-500' : isTarea ? 'border-2 border-gray-200 text-gray-300 hover:border-brand hover:text-brand' : isIngreso ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                    >
                                        {isPagado ? <CheckCircle2 size={24} /> : isTarea ? <CheckCircle2 size={24} /> : isIngreso ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                    </button>
                                    
                                    <div className={`flex-1 min-w-0 py-1 ${isPagado ? 'line-through text-gray-400' : ''}`}>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-bold leading-tight truncate ${isVencida ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {isTarea ? actItem.titulo : isIngreso ? `Cobro: ${actItem.empresa_nombre}` : `Pago: ${actItem.observacion}`}
                                                </p>
                                            </div>
                                            {isTarea && actItem.observacion && (
                                                <p className={`text-[12px] italic leading-snug mt-0.5 line-clamp-2 ${isPagado ? 'text-gray-400 opacity-70' : 'text-gray-500 font-medium'}`}>
                                                    {actItem.observacion}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                                            {!isTarea && (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isIngreso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {actItem.moneda === 'USD' ? '$' : 'Bs.'} {actItem.monto}
                                                </span>
                                            )}
                                            {isTarea && actItem.proyecto_nombre && (
                                                <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                                                    {actItem.empresa_nombre ? `${actItem.empresa_nombre}: ` : ''}{actItem.proyecto_nombre}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Botones de acción Tarea (Solo tareas se editan por ahora en Dashboard) */}
                                    {isTarea && (
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button onClick={() => setEditTask(actItem)} className="p-2 bg-gray-50 rounded-xl text-gray-400 active:bg-gray-200 transition-colors">
                                                <PenSquare size={16} />
                                            </button>
                                            <button onClick={() => handleEliminar(actItem.id)} className="p-2 bg-red-50 rounded-xl text-red-500 active:bg-red-200 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col items-center shadow-sm text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${viendoRetrasados ? 'bg-red-50 text-red-300' : 'bg-gray-50 text-gray-300'}`}>
                            {viendoRetrasados ? <CheckCircle2 size={24} /> : <CalIcon size={24} />}
                        </div>
                        <p className="font-bold text-gray-500 text-sm">
                            {viendoRetrasados ? "¡Todo al día!" : "El día está libre"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {viendoRetrasados ? "No tienes ninguna obligación retrasada." : "Disfruta tu descanso o añade nuevas actividades."}
                        </p>
                    </div>
                )}
            </div>

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
        </div>
    );
};

export default Dashboard;