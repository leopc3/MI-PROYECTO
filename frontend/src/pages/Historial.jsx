import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Calendar, Building2, CheckCircle2 } from 'lucide-react';

const Historial = () => {
    const [originalTasks, setOriginalTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [filtro, setFiltro] = useState({ fecha: '', empresa_id: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                // ← FIX CRÍTICO: usa /historial, no /dashboard
                const [tasksRes, empRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/tareas/historial', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:5000/api/empresas', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);
                setOriginalTasks(tasksRes.data);
                setFilteredTasks(tasksRes.data);
                setEmpresas(empRes.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        load();
    }, []);

    // Filtrado reactivo
    useEffect(() => {
        let result = originalTasks;
        if (filtro.fecha) {
            result = result.filter(t => t.fecha_asignada?.split('T')[0] === filtro.fecha);
        }
        if (filtro.empresa_id) {
            // empresa_id_real viene del JOIN en el controller
            result = result.filter(t => t.empresa_id_real === parseInt(filtro.empresa_id));
        }
        setFilteredTasks(result);
    }, [filtro, originalTasks]);

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800">Historial</h1>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {filteredTasks.length} tareas completadas
                </p>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 space-y-3">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <Calendar size={18} className="text-gray-400 shrink-0" />
                    <input
                        type="date"
                        className="flex-1 outline-none text-sm text-gray-600"
                        onChange={e => setFiltro({ ...filtro, fecha: e.target.value })}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-gray-400 shrink-0" />
                    <select
                        className="flex-1 outline-none text-sm bg-transparent text-gray-600"
                        onChange={e => setFiltro({ ...filtro, empresa_id: e.target.value })}
                    >
                        <option value="">Todas las empresas</option>
                        {empresas.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="text-center py-20 text-gray-300">Cargando historial...</div>
            ) : filteredTasks.length > 0 ? (
                <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    {filteredTasks.map(tarea => (
                        <div key={tarea.id} className="bg-white p-4 rounded-2xl border-l-4 border-green-500 shadow-sm">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-500 line-through truncate">{tarea.titulo}</p>
                                    {tarea.observacion && (
                                        <p className="text-xs text-gray-400 italic mt-0.5 truncate">{tarea.observacion}</p>
                                    )}
                                    <div className="flex justify-between items-center mt-2 flex-wrap gap-1">
                                        <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-lg text-gray-500 uppercase font-bold">
                                            {tarea.empresa_nombre || tarea.proyecto_nombre || 'General'}
                                        </span>
                                        {tarea.creado_por === 'cliente' && (
                                            <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-lg font-black uppercase">
                                                Cliente
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-400">
                                            {tarea.fecha_cumplida
                                                ? new Date(tarea.fecha_cumplida).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-300 italic">
                    No hay tareas completadas con estos filtros.
                </div>
            )}
        </div>
    );
};

export default Historial;