import { useState, useEffect } from 'react';
import axios from 'axios';

const EditTaskModal = ({ tarea, onClose, onSaved }) => {
    const [titulo, setTitulo] = useState(tarea.titulo);
    const [obs, setObs] = useState(tarea.observacion || '');
    const [fecha, setFecha] = useState(tarea.fecha_asignada ? tarea.fecha_asignada.split('T')[0] : '');
    const [proyectos, setProyectos] = useState([]);
    const [proyectoId, setProyectoId] = useState(tarea.proyecto_id || '');
    const [proyectosLoaded, setProyectosLoaded] = useState(false);

    const loadProyectos = async () => {
        if (proyectosLoaded) return;
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:5000/api/proyectos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProyectos(res.data);
            setProyectosLoaded(true);
        } catch (err) { console.error(err); }
    };

    // Si ya tenía proyecto asociado, es bueno cargar la lista de inmediato para mostrar los nombres
    useEffect(() => {
        if (proyectoId) loadProyectos();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5000/api/tareas/${tarea.id}`, {
                titulo,
                fecha_asignada: fecha,
                observacion: obs,
                proyecto_id: proyectoId || null,
            });
            onSaved();
            onClose();
        } catch (error) { console.error(error); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
            <form onSubmit={handleSubmit} className="bg-white w-full max-w-md md:max-w-xl p-6 rounded-2xl space-y-4 shadow-2xl">
                <h2 className="text-xl font-bold text-gray-800">Editar Tarea</h2>

                <input
                    type="text"
                    placeholder="Título de la tarea"
                    required
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand font-medium text-gray-800"
                />

                <input
                    type="date"
                    required
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand text-gray-600"
                />

                <textarea
                    placeholder="Observaciones o detalles..."
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand resize-none text-gray-600"
                    rows={2}
                />

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Proyecto Asociado
                    </label>
                    <select
                        value={proyectoId}
                        onChange={e => setProyectoId(e.target.value)}
                        onFocus={loadProyectos}
                        className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                    >
                        <option value="">Sin proyecto (tarea general)</option>
                        {proyectos.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.empresa_nombre ? `${p.empresa_nombre} — ` : ''}{p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">
                        Cancelar
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/30">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditTaskModal;
