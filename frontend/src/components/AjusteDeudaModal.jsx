import { useState, useEffect } from 'react';
import axios from 'axios';

const AjusteDeudaModal = ({ deuda, onClose, onSaved }) => {
    const [tipo, setTipo] = useState('disminucion');
    const [monto, setMonto] = useState('');
    const [obs, setObs] = useState('');
    const [historial, setHistorial] = useState([]);

    useEffect(() => {
        if (deuda.mode === 'historial') {
            axios.get(`http://localhost:5000/api/deudas/${deuda.id}/historial`).then(res => setHistorial(res.data));
        }
    }, [deuda]);

    const handleAjuste = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:5000/api/deudas/${deuda.id}/ajuste`, { tipo, monto, observacion: obs });
            onSaved();
            onClose();
        } catch (error) { console.error(error); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
            <div className="bg-white w-full max-w-md md:max-w-xl p-6 rounded-t-3xl sm:rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">{deuda.mode === 'ajuste' ? 'Ajustar Deuda' : 'Historial de Ajustes'}</h2>
                    <button onClick={onClose} className="text-gray-400">Cerrar</button>
                </div>

                {deuda.mode === 'ajuste' ? (
                    <form onSubmit={handleAjuste} className="space-y-4">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button type="button" onClick={() => setTipo('disminucion')} className={`flex-1 py-2 rounded-lg font-bold ${tipo === 'disminucion' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>- Disminuir</button>
                            <button type="button" onClick={() => setTipo('aumento')} className={`flex-1 py-2 rounded-lg font-bold ${tipo === 'aumento' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}>+ Aumentar</button>
                        </div>
                        <input type="number" placeholder="Monto del ajuste" required className="w-full p-3 border rounded-xl" onChange={e => setMonto(e.target.value)} />
                        <input type="text" placeholder="¿Por qué el cambio?" required className="w-full p-3 border rounded-xl" onChange={e => setObs(e.target.value)} />
                        <button type="submit" className="w-full py-3 bg-brand text-white rounded-xl font-bold">Confirmar Ajuste</button>
                    </form>
                ) : (
                    <div className="space-y-3">
                        {historial.map(h => (
                            <div key={h.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400">{new Date(h.fecha_registro).toLocaleDateString()}</p>
                                    <p className="text-sm font-medium">{h.observacion}</p>
                                </div>
                                <span className={`font-bold ${h.tipo === 'aumento' ? 'text-green-600' : 'text-red-600'}`}>
                                    {h.tipo === 'aumento' ? '+' : '-'} Bs. {h.monto}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AjusteDeudaModal;