import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MinusCircle, PlusCircle, History, Trash2, Building2, CheckCircle2, ChevronDown } from 'lucide-react';
import AddDeudaModal from '../components/AddDeudaModal';
import AjusteDeudaModal from '../components/AjusteDeudaModal';

const Deudas = () => {
    const [deudas, setDeudas] = useState([]);
    const [deudasCompletadas, setDeudasCompletadas] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDeuda, setSelectedDeuda] = useState(null);
    const [mostrarCompletadas, setMostrarCompletadas] = useState(false);

    const token = localStorage.getItem('token');

    const fetchDeudas = async () => {
        try {
            const [activas, completadas] = await Promise.all([
                axios.get('/api/deudas?estado=activa', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/deudas?estado=completada', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setDeudas(activas.data);
            setDeudasCompletadas(completadas.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchDeudas(); }, []);

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Eliminar esta deuda y todo su historial?')) return;
        try {
            await axios.delete(`/api/deudas/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setDeudas(deudas.filter(d => d.id !== id));
            setDeudasCompletadas(deudasCompletadas.filter(d => d.id !== id));
        } catch (error) { console.error(error); }
    };

    const handleAjusteSaved = (deudaActualizada) => {
        if (deudaActualizada && deudaActualizada.estado === 'completada') {
            // Mover de activas a completadas
            setDeudas(prev => prev.filter(d => d.id !== deudaActualizada.id));
            setDeudasCompletadas(prev => [deudaActualizada, ...prev]);
        } else {
            // Actualizar monto en activas
            setDeudas(prev => prev.map(d => d.id === deudaActualizada?.id ? { ...d, monto_total: deudaActualizada.monto_total } : d));
        }
        setSelectedDeuda(null);
    };

    const CardDeuda = ({ deuda, esCompletada = false }) => (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border ${esCompletada ? 'border-green-100 opacity-80' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-1">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {esCompletada && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                        <h2 className="font-bold text-lg text-gray-800 truncate">{deuda.concepto}</h2>
                    </div>
                    {deuda.empresa_nombre && (
                        <p className="text-xs text-brand flex items-center gap-1 mt-0.5">
                            <Building2 size={11} /> {deuda.empresa_nombre}
                        </p>
                    )}
                </div>
                <span className={`text-2xl font-black ml-2 shrink-0 ${esCompletada ? 'text-green-600' : 'text-red-600'}`}>
                    Bs. {parseFloat(deuda.monto_total).toFixed(2)}
                </span>
            </div>

            {deuda.observacion && (
                <p className="text-sm text-gray-500 mb-3 italic">{deuda.observacion}</p>
            )}

            <div className="flex gap-2 mt-3">
                {!esCompletada && (
                    <button
                        onClick={() => setSelectedDeuda({ ...deuda, mode: 'ajuste' })}
                        className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-medium text-sm active:scale-95 transition-all"
                    >
                        <PlusCircle size={16} /> / <MinusCircle size={16} /> Ajustar
                    </button>
                )}
                <button
                    onClick={() => setSelectedDeuda({ ...deuda, mode: 'historial' })}
                    className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                    title="Historial de pagos"
                >
                    <History size={18} />
                </button>
                <button
                    onClick={() => handleEliminar(deuda.id)}
                    className="bg-red-50 text-red-500 px-4 py-2.5 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                    title="Eliminar deuda"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800">Deudas</h1>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {deudas.length} activa{deudas.length !== 1 ? 's' : ''} · {deudasCompletadas.length} completada{deudasCompletadas.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Deudas Activas */}
            <div className={deudas.length === 0 ? 'space-y-4' : 'grid md:grid-cols-2 gap-4'}>
                {deudas.length === 0 && (
                    <div className="text-center py-16 text-gray-300 italic">No hay deudas activas.</div>
                )}
                {deudas.map(deuda => <CardDeuda key={deuda.id} deuda={deuda} />)}
            </div>

            {/* Deudas Completadas */}
            {deudasCompletadas.length > 0 && (
                <div className="mt-8">
                    <button
                        onClick={() => setMostrarCompletadas(prev => !prev)}
                        className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 mb-4 active:opacity-70"
                    >
                        <CheckCircle2 size={14} className="text-green-500" />
                        Completadas ({deudasCompletadas.length})
                        <ChevronDown size={14} className={`transition-transform ${mostrarCompletadas ? 'rotate-180' : ''}`} />
                    </button>
                    {mostrarCompletadas && (
                        <div className="grid md:grid-cols-2 gap-4">
                            {deudasCompletadas.map(deuda => <CardDeuda key={deuda.id} deuda={deuda} esCompletada />)}
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-24 right-5 w-16 h-16 bg-brand text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand/30 active:scale-95 transition-all"
            >
                <Plus size={28} />
            </button>

            {isAddModalOpen && (
                <AddDeudaModal onClose={() => setIsAddModalOpen(false)} onSaved={fetchDeudas} />
            )}

            {selectedDeuda && (
                <AjusteDeudaModal
                    deuda={selectedDeuda}
                    onClose={() => setSelectedDeuda(null)}
                    onSaved={handleAjusteSaved}
                />
            )}
        </div>
    );
};

export default Deudas;