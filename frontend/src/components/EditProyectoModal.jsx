import { useState } from 'react';
import axios from 'axios';

const EditProyectoModal = ({ proyecto, onClose, onSaved }) => {
    const [nombre, setNombre] = useState(proyecto.nombre);
    const [observacion, setObservacion] = useState(proyecto.observacion || '');
    const [estado, setEstado] = useState(proyecto.estado || 'activo');
    const [observacionEstado, setObservacionEstado] = useState(proyecto.observacion_estado || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.put(
                `http://localhost:5000/api/proyectos/actualizar/${proyecto.id}`,
                { nombre, observacion, estado, observacion_estado: observacionEstado },
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
            <div className="bg-white w-full max-w-md md:max-w-xl p-6 rounded-2xl shadow-xl">
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
