import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, FolderKanban, Building2, Link, Pencil, Trash2, RefreshCw, Calendar } from 'lucide-react';
import AddProyectoModal from '../components/AddProyectoModal';
import EditProyectoModal from '../components/EditProyectoModal';

const Proyectos = () => {
    const [proyectos, setProyectos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editProyecto, setEditProyecto] = useState(null);
    const [filtroEmpresa, setFiltroEmpresa] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('activo'); // Default ver activos sólo

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [proyectosRes, empresasRes] = await Promise.all([
                axios.get('http://localhost:5000/api/proyectos', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/empresas', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            setProyectos(proyectosRes.data);
            setEmpresas(empresasRes.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Eliminar este proyecto y todas sus tareas?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/proyectos/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProyectos(proyectos.filter(p => p.id !== id));
        } catch (error) { console.error(error); }
    };

    const handleProyectoCreado = (nuevoProyecto) => {
        const empresaAsociada = empresas.find(e => e.id === nuevoProyecto.empresa_id);
        setProyectos([{ ...nuevoProyecto, empresa_nombre: empresaAsociada?.nombre || 'Desconocida' }, ...proyectos]);
        setIsModalOpen(false);
    };

    const handleProyectoEditado = (proyectoActualizado) => {
        setProyectos(proyectos.map(p => p.id === proyectoActualizado.id ? { ...p, ...proyectoActualizado } : p));
        setEditProyecto(null);
    };

    const copyLink = (enlace) => {
        navigator.clipboard.writeText(`${window.location.origin}/enlace/${enlace}`);
        alert('¡Enlace copiado al portapapeles!');
    };

    const proyectosFiltrados = proyectos.filter(p => {
        const matchEmp = filtroEmpresa ? p.empresa_id === parseInt(filtroEmpresa) : true;
        const matchEst = filtroEstado ? (p.estado || 'activo') === filtroEstado : true;
        return matchEmp && matchEst;
    });

    const getEstadoColor = (estado) => {
        if (estado === 'pausado') return 'bg-yellow-100 text-yellow-700';
        if (estado === 'completado') return 'bg-green-100 text-green-700';
        return 'bg-brand/10 text-brand'; // activo
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-5 px-1">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Proyectos</h1>
                </div>
                <div className="flex bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden shrink-0 mt-1">
                    <button onClick={() => setFiltroEstado('activo')} className={`px-2 py-1.5 text-[10px] font-bold uppercase transition-all ${filtroEstado === 'activo' ? 'bg-brand text-white' : 'text-gray-400'}`}>Activos</button>
                    <button onClick={() => setFiltroEstado('pausado')} className={`px-2 py-1.5 text-[10px] font-bold uppercase transition-all ${filtroEstado === 'pausado' ? 'bg-brand text-white' : 'text-gray-400'}`}>Pausa</button>
                    <button onClick={() => setFiltroEstado('completado')} className={`px-2 py-1.5 text-[10px] font-bold uppercase transition-all ${filtroEstado === 'completado' ? 'bg-brand text-white' : 'text-gray-400'}`}>Fin</button>
                </div>
            </div>

            <div className="flex justify-between mb-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{proyectosFiltrados.length} proyectos</p>
                <button

                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand text-white p-3 rounded-2xl shadow-lg shadow-brand/30 active:scale-95 transition-all"
                >
                    <Plus size={22} />
                </button>
            </div>

            {/* Filtro por empresa */}
            <div className="mb-5">
                <select
                    value={filtroEmpresa}
                    onChange={e => setFiltroEmpresa(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-medium text-gray-600 outline-none"
                >
                    <option value="">Todas las empresas</option>
                    {empresas.map(e => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                </select>
            </div>

            {proyectosFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {proyectosFiltrados.map(proyecto => (
                        <div key={proyecto.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex gap-2">
                                        <p className="font-bold text-gray-900 flex items-center gap-2 truncate">
                                            <FolderKanban size={15} className="text-brand shrink-0" />
                                            {proyecto.nombre}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <Building2 size={13} /> {proyecto.empresa_nombre}
                                    </p>
                                    {proyecto.observacion && (
                                        <p className="text-xs text-gray-400 mt-1 italic truncate">{proyecto.observacion}</p>
                                    )}
                                    {/* Badge */}
                                    <div className="mt-2 flex items-center gap-2">
                                        {proyecto.es_recurrente ? (
                                            <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full uppercase">
                                                <RefreshCw size={9} /> Recurrente
                                            </span>
                                        ) : proyecto.fecha_fin ? (
                                            <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase">
                                                <Calendar size={9} /> Hasta: {new Date(proyecto.fecha_fin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => copyLink(proyecto.enlace_dinamico)} className="p-2 rounded-xl bg-gray-50 text-gray-400 active:scale-95 transition-all" title="Copiar enlace cliente">
                                        <Link size={16} />
                                    </button>
                                    <button onClick={() => setEditProyecto(proyecto)} className="p-2 rounded-xl bg-blue-50 text-brand active:scale-95 transition-all" title="Editar">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleEliminar(proyecto.id)} className="p-2 rounded-xl bg-red-50 text-red-500 active:scale-95 transition-all" title="Eliminar">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-300 italic">
                    No hay proyectos. ¡Crea el primero!
                </div>
            )}

            {isModalOpen && (
                <AddProyectoModal
                    empresas={empresas}
                    onClose={() => setIsModalOpen(false)}
                    onProyectoCreado={handleProyectoCreado}
                />
            )}

            {editProyecto && (
                <EditProyectoModal
                    proyecto={editProyecto}
                    onClose={() => setEditProyecto(null)}
                    onSaved={handleProyectoEditado}
                />
            )}
        </div>
    );
};

export default Proyectos;