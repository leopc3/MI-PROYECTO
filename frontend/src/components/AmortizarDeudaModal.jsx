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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-[100]">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md md:max-w-xl p-6 rounded-t-3xl sm:rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{deuda.mode === 'historial' ? 'Historial de Ajustes' : 'Ajustar Deuda'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{deuda.concepto}</p>
                        <p className="text-sm font-black text-red-600 dark:text-red-400">Saldo: Bs. {parseFloat(deuda.monto_total).toFixed(2)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors">Cerrar</button>
                </div>

                {deuda.mode !== 'historial' && (
                    <form onSubmit={handleAjuste} className="space-y-3">
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setTipo('disminucion')}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                                    tipo === 'disminucion'
                                        ? 'bg-white dark:bg-gray-700 shadow text-red-600 dark:text-red-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                − Pago / Amortización
                            </button>
                            <button
                                type="button"
                                onClick={() => setTipo('aumento')}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                                    tipo === 'aumento'
                                        ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                + Aumentar Deuda
                            </button>
                        </div>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Monto (ej: 500.00)"
                            value={monto}
                            onChange={e => setMonto(e.target.value)}
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                        />
                        <input
                            type="text"
                            placeholder="Observación (opcional)"
                            value={obs}
                            onChange={e => setObs(e.target.value)}
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                        />
                        {error && <p className="text-red-500 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-100 dark:border-red-900/50">{error}</p>}
                        {resultado && <p className="text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-950/40 p-3 rounded-xl border border-green-100 dark:border-green-900/50">{resultado}</p>}
                        <button type="submit" disabled={saving} className="w-full py-3 bg-brand hover:opacity-90 text-white rounded-xl font-bold active:scale-95 transition-all">
                            {saving ? 'Guardando...' : 'Confirmar Ajuste'}
                        </button>
                    </form>
                )}

                {/* Historial siempre visible */}
                {historial.length > 0 && (
                    <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <History size={12} /> Historial de pagos
                        </p>
                        {historial.map(h => (
                            <div key={h.id} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex justify-between items-center border border-transparent dark:border-gray-800">
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(h.fecha_registro).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{h.observacion}</p>
                                </div>
                                <span className={`font-black text-sm ${h.tipo === 'aumento' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {h.tipo === 'aumento' ? '+' : '−'} Bs. {parseFloat(h.monto).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                {historial.length === 0 && (
                    <p className="text-center text-gray-400 dark:text-gray-600 text-sm italic py-2">Sin pagos registrados aún</p>
                )}
            </div>
        </div>
    );
};

export default AmortizarDeudaModal;