import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Building2, Pencil, Trash2, FileText } from 'lucide-react';
import AddEmpresaModal from '../components/AddEmpresaModal';
import EmpresaDetailModal from '../components/EmpresaDetailModal';

const Empresas = () => {
    const [empresas, setEmpresas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);  // para editar
    const [detailEmpresa, setDetailEmpresa] = useState(null);      // para ver notas

    const fetchEmpresas = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:5000/api/empresas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setEmpresas(res.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchEmpresas(); }, []);

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Eliminar esta empresa? Se eliminarán todos sus proyectos y tareas.')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/empresas/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setEmpresas(empresas.filter(e => e.id !== id));
        } catch (error) { console.error(error); }
    };

    const handleEmpresaGuardada = (empresaActualizada) => {
        if (selectedEmpresa) {
            // Modo edición
            setEmpresas(empresas.map(e => e.id === empresaActualizada.id ? empresaActualizada : e));
            setSelectedEmpresa(null);
        } else {
            // Modo creación
            setEmpresas([empresaActualizada, ...empresas]);
        }
        setIsModalOpen(false);
    };

    const handleNotasSaved = (empresaActualizada) => {
        setEmpresas(empresas.map(e => e.id === empresaActualizada.id ? empresaActualizada : e));
        setDetailEmpresa(empresaActualizada); // actualizar el modal también
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Empresas</h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{empresas.length} registradas</p>
                </div>
                <button
                    onClick={() => { setSelectedEmpresa(null); setIsModalOpen(true); }}
                    className="bg-brand text-white p-3 rounded-2xl shadow-lg shadow-brand/30 active:scale-95 transition-all"
                >
                    <Plus size={22} />
                </button>
            </div>

            {empresas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {empresas.map(empresa => (
                        <div key={empresa.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between gap-3">
                                {/* Info empresa */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="bg-brand/10 p-2.5 rounded-xl shrink-0">
                                        <Building2 size={20} className="text-brand" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{empresa.nombre}</p>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">
                                            {empresa.notas_ideas ? empresa.notas_ideas.substring(0, 45) + '...' : 'Sin notas'}
                                        </p>
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => setDetailEmpresa(empresa)}
                                        className="p-2 rounded-xl bg-amber-50 text-amber-500 active:scale-95 transition-all"
                                        title="Ver notas"
                                    >
                                        <FileText size={16} />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedEmpresa(empresa); setIsModalOpen(true); }}
                                        className="p-2 rounded-xl bg-blue-50 text-brand active:scale-95 transition-all"
                                        title="Editar"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(empresa.id)}
                                        className="p-2 rounded-xl bg-red-50 text-red-500 active:scale-95 transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-300 italic">
                    No tienes empresas registradas. ¡Añade una!
                </div>
            )}

            {/* Modal: Crear o Editar */}
            {isModalOpen && (
                <AddEmpresaModal
                    empresa={selectedEmpresa}
                    onClose={() => { setIsModalOpen(false); setSelectedEmpresa(null); }}
                    onEmpresaGuardada={handleEmpresaGuardada}
                />
            )}

            {/* Modal: Ver Notas */}
            {detailEmpresa && (
                <EmpresaDetailModal
                    empresa={detailEmpresa}
                    onClose={() => setDetailEmpresa(null)}
                    onSaved={handleNotasSaved}
                />
            )}
        </div>
    );
};

export default Empresas;