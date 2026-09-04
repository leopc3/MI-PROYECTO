import { useState, useEffect } from 'react';
import axios from 'axios';
import { History } from 'lucide-react';

const AmortizarDeudaModal = ({ deuda, onClose, onSaved }) => {
    const [tipo, setTipo] = useState('disminucion');
    const [monto, setMonto] = useState('');
    const [obs, setObs] = useState('');
    const [historial, setHistorial] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [resultado, setResultado] = useState('');

    const token = localStorage.getItem('token');

    const cargarHistorial = () => {
        axios.get(`/api/deudas/${deuda.id}/historial`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setHistorial(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => { cargarHistorial(); }, [deuda.id]);

    const handleAjuste = async (e) => {
        e.preventDefault();
        setError('');
        setResultado('');
        const rawMonto = String(monto || '').replace(/,/g, '.').trim();
        const montoFinal = parseFloat(rawMonto);
        if (isNaN(montoFinal) || montoFinal <= 0) {
            setError('Por favor ingresa un monto válido.');
            return;
        }
        setSaving(true);
        try {
            const res = await axios.post(`/api/deudas/${deuda.id}/ajuste`,
                { tipo, monto: montoFinal, observacion: obs || (tipo === 'disminucion' ? 'Pago / Amortización' : 'Aumento de deuda') },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const deudaActualizada = res.data;
            if (deudaActualizada.estado === 'completada') {
                setResultado('✅ ¡Deuda completada! Se eliminará del inicio.');
                setTimeout(() => { onSaved(deudaActualizada); onClose(); }, 1500);
            } else {
                setResultado(`✅ Ajuste registrado. Saldo restante: Bs. ${parseFloat(deudaActualizada.monto_total).toFixed(2)}`);
                setMonto('');
                setObs('');
                cargarHistorial();
                setTimeout(() => { onSaved(deudaActualizada); }, 500);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'No se pudo registrar el ajuste.');
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
            <div className="bg-white w-full max-w-md md:max-w-xl p-6 rounded-t-3xl sm:rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">{deuda.mode === 'historial' ? 'Historial de Ajustes' : 'Ajustar Deuda'}</h2>
                        <p className="text-sm text-gray-500">{deuda.concepto}</p>
                        <p className="text-sm font-black text-red-600">Saldo: Bs. {parseFloat(deuda.monto_total).toFixed(2)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 font-medium">Cerrar</button>
                </div>

                {deuda.mode !== 'historial' && (
                    <form onSubmit={handleAjuste} className="space-y-3">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button type="button" onClick={() => setTipo('disminucion')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${tipo === 'disminucion' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>
                                − Pago / Amortización
                            </button>
                            <button type="button" onClick={() => setTipo('aumento')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${tipo === 'aumento' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}>
                                + Aumentar Deuda
                            </button>
                        </div>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Monto (ej: 500.00)"
                            value={monto}
                            onChange={e => setMonto(e.target.value)}
                            className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                        />
                        <input
                            type="text"
                            placeholder="Observación (opcional)"
                            value={obs}
                            onChange={e => setObs(e.target.value)}
                            className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                        />
                        {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl">{error}</p>}
                        {resultado && <p className="text-green-600 text-sm font-medium bg-green-50 p-3 rounded-xl">{resultado}</p>}
                        <button type="submit" disabled={saving} className="w-full py-3 bg-brand text-white rounded-xl font-bold active:scale-95 transition-all">
                            {saving ? 'Guardando...' : 'Confirmar Ajuste'}
                        </button>
                    </form>
                )}

                {/* Historial siempre visible */}
                {historial.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                            <History size={12} /> Historial de pagos
                        </p>
                        {historial.map(h => (
                            <div key={h.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400">
                                        {new Date(h.fecha_registro).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                    <p className="text-sm font-medium text-gray-700">{h.observacion}</p>
                                </div>
                                <span className={`font-black text-sm ${h.tipo === 'aumento' ? 'text-green-600' : 'text-red-600'}`}>
                                    {h.tipo === 'aumento' ? '+' : '−'} Bs. {parseFloat(h.monto).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                {historial.length === 0 && (
                    <p className="text-center text-gray-300 text-sm italic py-2">Sin pagos registrados aún</p>
                )}
            </div>
        </div>
    );
};

export default AmortizarDeudaModal;