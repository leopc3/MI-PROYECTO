import { useState } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';

const DIAS_SEMANA = [
    { label: 'Dom', value: 0 },
    { label: 'Lun', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Mié', value: 3 },
    { label: 'Jue', value: 4 },
    { label: 'Vie', value: 5 },
    { label: 'Sáb', value: 6 },
];

const EditProyectoModal = ({ proyecto, onClose, onSaved }) => {
    const [nombre, setNombre] = useState(proyecto.nombre);
    const [observacion, setObservacion] = useState(proyecto.observacion || '');
    const [estado, setEstado] = useState(proyecto.estado || 'activo');
    const [observacionEstado, setObservacionEstado] = useState(proyecto.observacion_estado || '');
    const [diasRecurrentes, setDiasRecurrentes] = useState(
        Array.isArray(proyecto.dias_recurrentes) ? proyecto.dias_recurrentes : []
    );
    const [saving, setSaving] = useState(false);

    const toggleDia = (dia) => {
        setDiasRecurrentes(prev =>
            prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.put(
                `http://localhost:5000/api/proyectos/actualizar/${proyecto.id}`,
                {
                    nombre,
                    observacion,
                    estado,
                    observacion_estado: observacionEstado,
                    dias_recurrentes: proyecto.es_recurrente ? diasRecurrentes : null,
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            onSaved(res.data);
            onClose();
        } catch (error) {
            console.error('Error al actualizar proyecto:', error);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-md md:max-w-xl p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Editar Proyecto</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Proyecto</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                            className="mt-1 w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Observación</label>
                        <textarea
                            value={observacion}
                            onChange={e => setObservacion(e.target.value)}
                            rows={3}
                            className="mt-1 w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand outline-none resize-none"
                        />
                    </div>

                    {/* Selector de días — solo si el proyecto es recurrente */}
                    {proyecto.es_recurrente && (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                            <label className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest mb-3">
                                <RefreshCw size={13} /> Días de recurrencia
                            </label>
                            <div className="flex justify-between gap-1">
                                {DIAS_SEMANA.map(dia => (
                                    <button
                                        key={dia.value}
                                        type="button"
                                        onClick={() => toggleDia(dia.value)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                                            diasRecurrentes.includes(dia.value)
                                                ? 'bg-brand text-white shadow-sm'
                                                : 'bg-white text-gray-400 border border-gray-200 hover:border-brand hover:text-brand'
                                        }`}
                                    >
                                        {dia.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-blue-400 mt-2 font-medium">
                                ⚠️ Cambiar días no regenera tareas pasadas, solo actualiza la configuración.
                            </p>
                        </div>
                    )}

                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Estado del Proyecto
                        </label>
                        <select
                            value={estado}
                            onChange={e => setEstado(e.target.value)}
                            className="w-full p-3 border border-gray-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-brand font-bold text-gray-700"
                        >
                            <option value="activo">🟢 Activo</option>
                            <option value="pausado">🟡 Pausado</option>
                            <option value="completado">✅ Completado</option>
                        </select>

                        <textarea
                            placeholder="Mensaje sobre el estado (Visible para el Cliente)"
                            value={observacionEstado}
                            onChange={e => setObservacionEstado(e.target.value)}
                            className="w-full mt-3 p-3 border border-gray-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-brand resize-none"
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand text-white rounded-xl font-bold">
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProyectoModal;
