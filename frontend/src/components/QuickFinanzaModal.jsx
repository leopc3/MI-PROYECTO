import { useState } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

const QuickFinanzaModal = ({ tipo, selectedDate, onClose, onSaved }) => {
    const isIngreso = tipo === 'ingreso';

    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState('BOB');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Usar la fecha seleccionada en el calendario (igual que Añadir Tarea)
    const fecha = selectedDate || new Date();
    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
    const fechaLabel = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!concepto.trim() || !monto || parseFloat(monto) <= 0) {
            setError('Ingresa un concepto y un monto válido.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (isIngreso) {
                const res = await axios.post('/api/finanzas/ingresos', {
                    empresa_nombre: concepto.trim(),
                    monto: parseFloat(monto),
                    moneda,
                    fecha_estimada: fechaStr,
                    estado: 'pendiente',
                    descripcion: 'Cobro rápido',
                }, { headers: { Authorization: `Bearer ${token}` } });
                onSaved({
                    ...res.data,
                    empresa_nombre: concepto.trim(),
                    monto: parseFloat(monto),
                    moneda,
                    fecha_estimada: fechaStr,
                    estado: 'pendiente',
                    tipoItem: 'ingreso',
                });
            } else {
                const res = await axios.post('/api/finanzas/egresos', {
                    observacion: concepto.trim(),
                    monto: parseFloat(monto),
                    moneda,
                    fecha_pago: fechaStr,
                    estado: 'pendiente',
                }, { headers: { Authorization: `Bearer ${token}` } });
                onSaved({
                    ...res.data,
                    observacion: concepto.trim(),
                    monto: parseFloat(monto),
                    moneda,
                    fecha_pago: fechaStr,
                    estado: 'pendiente',
                    tipoItem: 'egreso',
                });
            }
            onClose();
        } catch (err) {
            console.error(err);
            setError('Error al guardar. Intenta de nuevo.');
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[200] p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className={`px-6 pt-6 pb-4 ${isIngreso ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isIngreso ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {isIngreso ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            </div>
                            <div>
                                <p className={`font-black text-base ${isIngreso ? 'text-green-700' : 'text-red-700'}`}>
                                    {isIngreso ? 'Cobro Rápido' : 'Pago Rápido'}
                                </p>
                                <p className="text-[11px] text-gray-400 font-medium capitalize">{fechaLabel}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Concepto */}
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                            {isIngreso ? 'Cliente / Concepto' : 'A quién / Concepto'}
                        </label>
                        <input
                            type="text"
                            autoFocus
                            value={concepto}
                            onChange={e => setConcepto(e.target.value)}
                            placeholder={isIngreso ? 'Ej: ECOLAVA, Factura Marzo...' : 'Ej: Proveedor, Renta...'}
                            className="w-full p-3 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand"
                        />
                    </div>

                    {/* Monto + Moneda */}
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Monto</label>
                        <div className="flex gap-2">
                            {/* Toggle BOB / USD */}
                            <div className="flex rounded-2xl border border-gray-200 overflow-hidden shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setMoneda('BOB')}
                                    className={`px-3 py-2 text-xs font-black transition-all ${moneda === 'BOB' ? 'bg-brand text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                                >Bs.</button>
                                <button
                                    type="button"
                                    onClick={() => setMoneda('USD')}
                                    className={`px-3 py-2 text-xs font-black transition-all ${moneda === 'USD' ? 'bg-brand text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                                >$</button>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={monto}
                                onChange={e => setMonto(e.target.value)}
                                placeholder="0.00"
                                className="flex-1 p-3 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                            />
                        </div>
                    </div>

                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                    {/* Botones */}
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-600 text-sm">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex-1 py-3 rounded-2xl font-black text-white text-sm transition-all ${isIngreso ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-60`}
                        >
                            {saving ? 'Guardando...' : isIngreso ? '+ Cobro' : '+ Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickFinanzaModal;
