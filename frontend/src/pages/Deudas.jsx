import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MinusCircle, PlusCircle, History, Trash2, Building2 } from 'lucide-react';
import AddDeudaModal from '../components/AddDeudaModal';
import AjusteDeudaModal from '../components/AjusteDeudaModal';

const Deudas = () => {
    const [deudas, setDeudas] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDeuda, setSelectedDeuda] = useState(null);

    const fetchDeudas = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/deudas');
            setDeudas(res.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchDeudas(); }, []);

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Eliminar esta deuda y todo su historial?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/deudas/${id}`);
            setDeudas(deudas.filter(d => d.id !== id));
        } catch (error) { console.error(error); }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800">Deudas</h1>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {deudas.length} {deudas.length === 1 ? 'deuda' : 'deudas'} registradas
                </p>
            </div>

            <div className={deudas.length === 0 ? 'space-y-4' : 'grid md:grid-cols-2 gap-4'}>
                {deudas.length === 0 && (
                    <div className="text-center py-20 text-gray-300 italic">No hay deudas registradas.</div>
                )}
                {deudas.map(deuda => (
                    <div key={deuda.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-lg text-gray-800 truncate">{deuda.concepto}</h2>
                                {deuda.empresa_nombre && (
                                    <p className="text-xs text-brand flex items-center gap-1 mt-0.5">
                                        <Building2 size={11} /> {deuda.empresa_nombre}
                                    </p>
                                )}
                            </div>
                            <span className="text-2xl font-black text-red-600 ml-2 shrink-0">
                                Bs. {parseFloat(deuda.monto_total).toFixed(2)}
                            </span>
                        </div>

                        {deuda.observacion && (
                            <p className="text-sm text-gray-500 mb-3 italic">{deuda.observacion}</p>
                        )}

                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setSelectedDeuda({ ...deuda, mode: 'ajuste' })}
                                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-medium text-sm active:scale-95 transition-all"
                            >
                                <PlusCircle size={16} /> / <MinusCircle size={16} /> Ajustar
                            </button>
                            <button
                                onClick={() => setSelectedDeuda({ ...deuda, mode: 'historial' })}
                                className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                                title="Historial de ajustes"
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
                ))}
            </div>

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
                    onSaved={fetchDeudas}
                />
            )}
        </div>
    );
};

export default Deudas;