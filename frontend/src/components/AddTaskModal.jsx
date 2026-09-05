import { useState } from 'react';
import axios from 'axios';

const AddTaskModal = ({ selectedDate, tituloInicial, onClose, onSaved }) => {
    const [titulo, setTitulo] = useState(tituloInicial || '');
    const [obs, setObs] = useState('');
    const [proyectos, setProyectos] = useState([]);
    const [proyectoId, setProyectoId] = useState('');
    const [proyectosLoaded, setProyectosLoaded] = useState(false);

    // Carga proyectos solo cuando el usuario hace clic en el selector
    const loadProyectos = async () => {
        if (proyectosLoaded) return;
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('/api/proyectos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProyectos(res.data);
            setProyectosLoaded(true);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const d = selectedDate;
            const fechaLocal = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            await axios.post('/api/tareas', {
                titulo,
                fecha_asignada: fechaLocal,
                observacion: obs,
                creado_por: 'admin',
                proyecto_id: proyectoId || null,
            });
            onSaved();
            onClose();
        } catch (error) { console.error(error); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-800 w-full max-w-md md:max-w-xl p-6 rounded-2xl space-y-4 shadow-2xl transition-colors">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Nueva Tarea</h2>
                <p className="text-xs text-brand font-bold uppercase tracking-wide">
                    Para el: {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>

                <input
                    type="text"
                    placeholder="¿Qué hay que hacer?"
                    required
                    autoFocus
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                />

                <textarea
                    placeholder="Observaciones o detalles..."
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:ring-2 focus:ring-brand resize-none"
                    rows={2}
                />

                {/* Selector de proyecto (opcional) */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Asociar a Proyecto (opcional)
                    </label>
                    <select
                        value={proyectoId}
                        onChange={e => setProyectoId(e.target.value)}
                        onFocus={loadProyectos}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                    >
                        <option value="" className="dark:bg-gray-900">Sin proyecto (general)</option>
                        {proyectos.map(p => (
                            <option key={p.id} value={p.id} className="dark:bg-gray-900">
                                {p.empresa_nombre ? `${p.empresa_nombre} — ` : ''}{p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-brand text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                        Añadir Tarea
                    </button>
                </div>
            </form>
        </div>
    );

};

export default AddTaskModal;