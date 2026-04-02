import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Lightbulb, CheckSquare, Trash2 } from 'lucide-react';
import AddTaskModal from './AddTaskModal';

const EmpresaDetailModal = ({ empresa, onClose, onSaved }) => {
    const [notas, setNotas] = useState(empresa.notas_ideas || '');
    const [proyectos, setProyectos] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [tareaInicial, setTareaInicial] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProyectos = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get('http://localhost:5000/api/proyectos', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setProyectos(res.data.filter(p => p.empresa_id === empresa.id));
            } catch (err) { console.error(err); }
        };
        fetchProyectos();
    }, [empresa.id]);

    const handleSaveNotas = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:5000/api/empresas/${empresa.id}`, {
                nombre: empresa.nombre,
                notas_ideas: notas
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            onSaved({ ...empresa, notas_ideas: notas });
        } catch (err) { console.error(err); }
        setSaving(false);
    };

    const handleConvertirEnTarea = () => {
        // Usa las notas como título inicial de la tarea
        setTareaInicial(notas.substring(0, 100));
        setShowTaskModal(true);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[100]">
                <div className="bg-white w-full max-w-lg md:max-w-2xl rounded-t-3xl sm:rounded-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-gray-800">{empresa.nombre}</h2>
                        <button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Notas / Ideas */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest mb-2">
                            <Lightbulb size={12} /> Notas e Ideas
                        </label>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={6}
                            className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                            placeholder="Escribe aquí ideas, observaciones, estrategias para esta empresa..."
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleSaveNotas}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
                            >
                                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar Notas'}
                            </button>
                            {notas && (
                                <button
                                    onClick={handleConvertirEnTarea}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
                                >
                                    <CheckSquare size={14} /> Convertir en Tarea
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Proyectos de esta empresa */}
                    {proyectos.length > 0 && (
                        <div>
                            <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Proyectos</p>
                            <div className="space-y-2">
                                {proyectos.map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                        <span className="text-sm font-semibold text-gray-700">{p.nombre}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.es_recurrente ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {p.es_recurrente ? 'Recurrente' : 'Proyecto'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showTaskModal && (
                <AddTaskModal
                    selectedDate={new Date()}
                    tituloInicial={tareaInicial}
                    onClose={() => setShowTaskModal(false)}
                    onSaved={() => setShowTaskModal(false)}
                />
            )}
        </>
    );
};

export default EmpresaDetailModal;
