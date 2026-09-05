import { useState, useEffect } from 'react';
import axios from 'axios';

const AddFinanzaModal = ({ tab, onClose, onSaved }) => {
    const [empresas, setEmpresas] = useState([]);
    const [formData, setFormData] = useState({
        empresa_id: '', monto: '', moneda: 'BOB', fecha: '', observacion: '', recurrente: false
    });

    useEffect(() => {
        if (tab === 'ingresos') {
            axios.get('/api/empresas').then(res => setEmpresas(res.data));
        }
    }, [tab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = tab === 'ingresos' ? '/api/finanzas/ingresos' : '/api/finanzas/egresos';

        const rawMonto = String(formData.monto || '').replace(',', '.').trim();
        const montoFinal = parseFloat(rawMonto);
        if (isNaN(montoFinal) || montoFinal <= 0) {
            alert('Por favor ingresa un monto válido.');
            return;
        }

        const payload = tab === 'ingresos'
            ? {
                empresa_id: formData.empresa_id,
                monto: montoFinal,
                moneda: formData.moneda,
                fecha_estimada: formData.fecha,
                observacion: formData.observacion,
                es_recurrente_mensual: formData.recurrente
            }
            : {
                monto: montoFinal,
                moneda: formData.moneda,
                fecha_pago: formData.fecha,
                es_recurrente_mensual: formData.recurrente,
                observacion: formData.observacion
            };

        try {
            await axios.post(`${endpoint}`, payload);
            onSaved();
            onClose();
        } catch (error) { console.error(error); }
    };


    const isIng = tab === 'ingresos';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 w-full max-w-md md:max-w-xl p-6 rounded-2xl space-y-4 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Añadir {isIng ? 'Ingreso / Cobro' : 'Egreso / Pago'}</h2>

                {isIng && (
                    <select
                        required
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                    >
                        <option value="">Seleccionar Empresa</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Monto (ej: 150.00)"
                        className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        onChange={e => setFormData({ ...formData, monto: e.target.value })}
                    />
                    <select
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        onChange={e => setFormData({ ...formData, moneda: e.target.value })}
                    >
                        <option value="BOB">BOB</option>
                        <option value="USD">USD</option>
                    </select>
                </div>

                <input
                    type="date"
                    required
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                />

                <input
                    type="text"
                    placeholder={isIng ? 'Observación (opcional)' : 'Descripción del gasto'}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    onChange={e => setFormData({ ...formData, observacion: e.target.value })}
                />

                <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-brand"
                        onChange={e => setFormData({ ...formData, recurrente: e.target.checked })}
                    />
                    ¿Se repite cada mes? (auto-genera 12 meses)
                </label>

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={`flex-1 py-3 text-white rounded-xl font-bold transition-opacity hover:opacity-90 ${isIng ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddFinanzaModal;