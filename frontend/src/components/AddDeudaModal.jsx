import { useState, useEffect } from 'react';
import axios from 'axios';

const AddDeudaModal = ({ onClose, onSaved }) => {
    const [empresas, setEmpresas] = useState([]);
    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState('');
    const [observacion, setObservacion] = useState('');
    const [empresaId, setEmpresaId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/empresas')
            .then(res => setEmpresas(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const rawMonto = String(monto || '').replace(/,/g, '.').trim();
        const montoFinal = parseFloat(rawMonto);
        if (isNaN(montoFinal) || montoFinal <= 0) {
            setError('Por favor ingresa un monto válido.');
            return;
        }
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            await axios.post('/api/deudas', {
                concepto,
                monto_total: montoFinal,
                observacion,
                empresa_id: empresaId || null
            }, { headers: { Authorization: `Bearer ${token}` } });
            onSaved();
            onClose();
        } catch (err) {
            console.error('Error al crear deuda:', err);
            setError(err.response?.data?.error || 'No se pudo guardar la deuda.');
        }
        setSaving(false);
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md md:max-w-xl p-6 rounded-2xl shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Registrar Nueva Deuda</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Concepto (¿A quién o qué?)</label>
                        <input
                            type="text"
                            required
                            value={concepto}
                            onChange={e => setConcepto(e.target.value)}
                            className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="Ej: Préstamo Banco, Proveedor X"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Inicial (Bs.)</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            required
                            value={monto}
                            onChange={e => setMonto(e.target.value)}
                            className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="Ej: 1500.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa asociada (opcional)</label>
                        <select
                            value={empresaId}
                            onChange={e => setEmpresaId(e.target.value)}
                            className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="">Sin empresa</option>
                            {empresas.map(e => (
                                <option key={e.id} value={e.id}>{e.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observación</label>
                        <textarea
                            value={observacion}
                            onChange={e => setObservacion(e.target.value)}
                            rows={2}
                            className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand hover:opacity-90 text-white rounded-xl font-bold transition-opacity">
                            {saving ? 'Guardando...' : 'Guardar Deuda'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDeudaModal;