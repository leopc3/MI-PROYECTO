import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CreditCard, Building2, PlusCircle, MinusCircle, History, Trash2, CheckCircle2, ChevronDown } from 'lucide-react';
import AddDeudaModal from '../components/AddDeudaModal';
import AjusteDeudaModal from '../components/AjusteDeudaModal';
import ThemeToggle from '../components/ThemeToggle';

const Deudas = () => {
    const [deudas, setDeudas] = useState([]);
    const [deudasCompletadas, setDeudasCompletadas] = useState([]);
    const [mostrarCompletadas, setMostrarCompletadas] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDeuda, setSelectedDeuda] = useState(null); // { ...deuda, mode: 'ajuste' | 'historial' }

    const fetchDeudas = async () => {
        const token = localStorage.getItem('token');
        try {
            const [resActivas, resCompletadas] = await Promise.all([
                axios.get('/api/deudas?estado=activa', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/deudas?estado=completada', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            setDeudas(resActivas.data);
            setDeudasCompletadas(resCompletadas.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchDeudas(); }, []);

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Eliminar esta deuda? Se eliminará también todo su historial.')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`/api/deudas/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setDeudas(deudas.filter(d => d.id !== id));
            setDeudasCompletadas(deudasCompletadas.filter(d => d.id !== id));
        } catch (error) { console.error(error); }
    };

    const handleAjusteSaved = (deudaActualizada) => {
        setSelectedDeuda(null);
        if (deudaActualizada.estado === 'completada') {
            setDeudas(prev => prev.filter(d => d.id !== deudaActualizada.id));
            setDeudasCompletadas(prev => [deudaActualizada, ...prev]);
        } else {
            setDeudas(prev => prev.map(d => d.id === deudaActualizada.id ? deudaActualizada : d));
        }
    };

    const CardDeuda = ({ deuda, esCompletada }) => (
        <div className={`bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border ${esCompletada ? 'border-green-100 dark:border-green-950/40 opacity-75' : 'border-gray-100 dark:border-gray-800'} transition-all`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{deuda.concepto}</h3>
                    {deuda.empresa_nombre && (
                        <p className="text-xs text-brand flex items-center gap-1 mt-0.5">
                            <Building2 size={11} /> {deuda.empresa_nombre}
                        </p>
                    )}
                </div>
                <span className={`text-2xl font-black ml-2 shrink-0 ${esCompletada ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    Bs. {parseFloat(deuda.monto_total).toFixed(2)}
                </span>
            </div>

            {deuda.observacion && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 italic">{deuda.observacion}</p>
            )}

            <div className="flex gap-2 mt-3">
                {!esCompletada && (
                    <button
                        onClick={() => setSelectedDeuda({ ...deuda, mode: 'ajuste' })}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-medium text-sm active:scale-95 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                        <PlusCircle size={16} /> / <MinusCircle size={16} /> Ajustar
                    </button>
                )}
                <button
                    onClick={() => setSelectedDeuda({ ...deuda, mode: 'historial' })}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 px-4 py-2.5 rounded-xl flex items-center justify-center active:scale-95 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    title="Historial de pagos"
                >
                    <History size={18} />
                </button>
                <button
                    onClick={() => handleEliminar(deuda.id)}
                    className="bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 px-4 py-2.5 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                    title="Eliminar deuda"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">Deudas</h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        {deudas.length} activa{deudas.length !== 1 ? 's' : ''} · {deudasCompletadas.length} completada{deudasCompletadas.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <ThemeToggle size={20} />
            </div>

            {/* Deudas Activas */}
            <div className={deudas.length === 0 ? 'space-y-4' : 'grid md:grid-cols-2 gap-4'}>
                {deudas.length === 0 && (
                    <div className="text-center py-16 text-gray-400 dark:text-gray-600 italic">No hay deudas activas.</div>
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