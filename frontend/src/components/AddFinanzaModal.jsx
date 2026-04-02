import { useState, useEffect } from 'react';
import axios from 'axios';

const AddFinanzaModal = ({ tab, onClose, onSaved }) => {
    const [empresas, setEmpresas] = useState([]);
    const [formData, setFormData] = useState({
        empresa_id: '', monto: '', moneda: 'BOB', fecha: '', observacion: '', recurrente: false
    });

    useEffect(() => {
        if (tab === 'ingresos') {
            axios.get('http://localhost:5000/api/empresas').then(res => setEmpresas(res.data));
        }
    }, [tab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = tab === 'ingresos' ? '/api/finanzas/ingresos' : '/api/finanzas/egresos';
        const payload = tab === 'ingresos'
            ? {
                empresa_id: formData.empresa_id,
                monto: formData.monto,
                moneda: formData.moneda,
                fecha_estimada: formData.fecha,
                observacion: formData.observacion,
                es_recurrente_mensual: formData.recurrente
            }
            : {
                monto: formData.monto,
                moneda: formData.moneda,        // ← ahora egresos también tiene moneda
                fecha_pago: formData.fecha,
                es_recurrente_mensual: formData.recurrente,
                observacion: formData.observacion
            };

        try {
            await axios.post(`http://localhost:5000${endpoint}`, payload);
            onSaved();
            onClose();
        } catch (error) { console.error(error); }
    };

    const isIng = tab === 'ingresos';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
            <form onSubmit={handleSubmit} className="bg-white w-full max-w-md md:max-w-xl p-6 rounded-2xl space-y-4 shadow-xl">
                <h2 className="text-xl font-bold">Añadir {isIng ? 'Ingreso / Cobro' : 'Egreso / Pago'}</h2>

                {isIng && (
                    <select
                        required
                        className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                        onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                    >
                        <option value="">Seleccionar Empresa</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                )}

                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Monto"
                        required
                        className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                        onChange={e => setFormData({ ...formData, monto: e.target.value })}
                    />
                    <select
                        className="p-3 border rounded-xl outline-none"
                        onChange={e => setFormData({ ...formData, moneda: e.target.value })}
                    >
                        <option value="BOB">BOB</option>
                        <option value="USD">USD</option>
                    </select>
                </div>

                <input
                    type="date"
                    required
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                />

                <input
                    type="text"
                    placeholder={isIng ? 'Observación (opcional)' : 'Descripción del gasto'}
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                    onChange={e => setFormData({ ...formData, observacion: e.target.value })}
                />

                <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-brand"
                        onChange={e => setFormData({ ...formData, recurrente: e.target.checked })}
                    />
                    ¿Se repite cada mes? (auto-genera 12 meses)
                </label>

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={`flex-1 py-3 text-white rounded-xl font-bold ${isIng ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddFinanzaModal;