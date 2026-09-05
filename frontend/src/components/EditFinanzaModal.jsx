import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';

const EditFinanzaModal = ({ item, tipo, onClose, onSaved }) => {
    const [empresas, setEmpresas] = useState([]);
    const [formData, setFormData] = useState({
        empresa_id: item.empresa_id || '',
        monto: item.monto || '',
        moneda: item.moneda || 'BOB',
        fecha: tipo === 'ingreso' ? (item.fecha_estimada?.split('T')[0] || '') : (item.fecha_pago?.split('T')[0] || ''),
        observacion: item.observacion || '',
    });
    const [actualizarSerie, setActualizarSerie] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');

    const esRecurrente = item.es_recurrente_mensual;
    const isIng = tipo === 'ingreso';

    useEffect(() => {
        if (isIng) {
            axios.get('/api/empresas').then(res => setEmpresas(res.data));
        }
    }, [tipo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setResultado(null);
        setError('');
        const token = localStorage.getItem('token');

        // Limpiar el monto para soportar comas decimales
        const rawMonto = String(formData.monto || '').replace(',', '.').trim();
        const montoFinal = parseFloat(rawMonto);

        if (isNaN(montoFinal) || montoFinal <= 0) {
            setError('Por favor ingresa un monto válido.');
            setSaving(false);
            return;
        }

        try {
            if (actualizarSerie && esRecurrente) {
                // Actualizar este mes + todos los futuros
                const endpoint = isIng
                    ? `/api/finanzas/ingresos/${item.id}/serie`
                    : `/api/finanzas/egresos/${item.id}/serie`;

                const body = isIng
                    ? { empresa_id: formData.empresa_id, monto: montoFinal, moneda: formData.moneda, observacion: formData.observacion }
                    : { monto: montoFinal, moneda: formData.moneda, observacion: formData.observacion };

                const res = await axios.put(endpoint, body, { headers: { Authorization: `Bearer ${token}` } });
                setResultado(`✅ ${res.data.actualizados} registro(s) actualizado(s)`);
                setTimeout(() => { onSaved(); onClose(); }, 1000);
            } else {
                // Actualizar solo este mes
                if (isIng) {
                    await axios.put(`/api/finanzas/ingresos/${item.id}`, {
                        empresa_id: formData.empresa_id,
                        monto: montoFinal,
                        moneda: formData.moneda,
                        fecha_estimada: formData.fecha,
                        observacion: formData.observacion,
                    }, { headers: { Authorization: `Bearer ${token}` } });
                } else {
                    await axios.put(`/api/finanzas/egresos/${item.id}`, {
                        monto: montoFinal,
                        moneda: formData.moneda,
                        fecha_pago: formData.fecha,
                        observacion: formData.observacion,
                    }, { headers: { Authorization: `Bearer ${token}` } });
                }
                onSaved();
                onClose();
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'No se pudo actualizar el registro.');
        }
        setSaving(false);
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 w-full max-w-md md:max-w-xl p-6 rounded-2xl space-y-4 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar {isIng ? 'Ingreso / Cobro' : 'Egreso / Gasto'}</h2>

                {isIng && (
                    <select
                        value={formData.empresa_id}
                        onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">Seleccionar Empresa</option>
                        {empresas.map(e => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                    </select>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Monto (ej: 150.00)"
                        value={formData.monto}
                        onChange={e => setFormData({ ...formData, monto: e.target.value })}
                        className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <select
                        value={formData.moneda}
                        onChange={e => setFormData({ ...formData, moneda: e.target.value })}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <option value="BOB">BOB</option>
                        <option value="USD">USD</option>
                    </select>
                </div>

                <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />

                <input
                    type="text"
                    placeholder="Observación"
                    value={formData.observacion}
                    onChange={e => setFormData({ ...formData, observacion: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />

                {/* Opción actualizar serie — solo si es recurrente */}
                {esRecurrente && (
                    <div
                        onClick={() => setActualizarSerie(!actualizarSerie)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            actualizarSerie
                                ? 'border-brand bg-orange-50 dark:bg-orange-950/30'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            actualizarSerie ? 'border-brand bg-brand' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                            {actualizarSerie && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <RefreshCw size={13} className={actualizarSerie ? 'text-brand' : 'text-gray-400 dark:text-gray-500'} />
                                <p className={`text-sm font-black ${actualizarSerie ? 'text-brand' : 'text-gray-600 dark:text-gray-300'}`}>
                                    Actualizar todos los meses futuros
                                </p>
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                Aplica el nuevo monto y observación a todos los pendientes futuros de esta serie
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold text-center border border-red-100 dark:border-red-900/50">
                        {error}
                    </div>
                )}

                {resultado && (
                    <p className="text-sm font-bold text-green-600 dark:text-green-400 text-center">{resultado}</p>
                )}


                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className={`flex-1 py-3 text-white rounded-xl font-bold transition-opacity hover:opacity-90 ${isIng ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-60`}
                    >
                        {saving ? 'Guardando...' : actualizarSerie ? 'Actualizar Serie' : 'Guardar Este Mes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditFinanzaModal;
