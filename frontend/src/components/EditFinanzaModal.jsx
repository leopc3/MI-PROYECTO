import { useState, useEffect } from 'react';
import axios from 'axios';

const EditFinanzaModal = ({ item, tipo, onClose, onSaved }) => {
    // tipo: 'ingreso' | 'egreso'
    const [empresas, setEmpresas] = useState([]);
    const [formData, setFormData] = useState({
        empresa_id: item.empresa_id || '',
        monto: item.monto || '',
        moneda: item.moneda || 'BOB',
        fecha: tipo === 'ingreso' ? (item.fecha_estimada?.split('T')[0] || '') : (item.fecha_pago?.split('T')[0] || ''),
        observacion: item.observacion || '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (tipo === 'ingreso') {
            axios.get('http://localhost:5000/api/empresas').then(res => setEmpresas(res.data));
        }
    }, [tipo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (tipo === 'ingreso') {
                await axios.put(`http://localhost:5000/api/finanzas/ingresos/${item.id}`, {
                    empresa_id: formData.empresa_id,
                    monto: formData.monto,
                    moneda: formData.moneda,
                    fecha_estimada: formData.fecha,
                    observacion: formData.observacion,
                });
            } else {
                await axios.put(`http://localhost:5000/api/finanzas/egresos/${item.id}`, {
                    monto: formData.monto,
                    moneda: formData.moneda,
                    fecha_pago: formData.fecha,
                    observacion: formData.observacion,
                });
            }
            onSaved();
            onClose();
        } catch (error) { console.error(error); }
        setSaving(false);
    };

    const isIng = tipo === 'ingreso';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
            <form onSubmit={handleSubmit} className="bg-white w-full max-w-md md:max-w-xl p-6 rounded-2xl space-y-4 shadow-xl">
                <h2 className="text-xl font-bold">Editar {isIng ? 'Ingreso/Cobro' : 'Egreso/Gasto'}</h2>

                {isIng && (
                    <select
                        required
                        value={formData.empresa_id}
                        onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                        className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                    >
                        <option value="">Seleccionar Empresa</option>
                        {empresas.map(e => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                    </select>
                )}

                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Monto"
                        required
                        value={formData.monto}
                        onChange={e => setFormData({ ...formData, monto: e.target.value })}
                        className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                    />
                    <select
                        value={formData.moneda}
                        onChange={e => setFormData({ ...formData, moneda: e.target.value })}
                        className="p-3 border rounded-xl outline-none"
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
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                />

                <input
                    type="text"
                    placeholder="Observación"
                    value={formData.observacion}
                    onChange={e => setFormData({ ...formData, observacion: e.target.value })}
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                />

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className={`flex-1 py-3 text-white rounded-xl font-bold ${isIng ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditFinanzaModal;
