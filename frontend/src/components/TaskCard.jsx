import { CheckCircle2, MessageSquare, Building2 } from 'lucide-react';
import axios from 'axios';

const TaskCard = ({ task, onCompleted }) => {
    const handleComplete = async () => {
        try {
            await axios.patch(`http://localhost:5000/api/tareas/${task.id}/estado`);
            onCompleted(task.id);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 animate-in fade-in slide-in-from-right-4">
            <div className="flex gap-4">
                {/* Botón de Cumplir */}
                <button onClick={handleComplete} className="mt-1 text-gray-200 hover:text-green-500 transition-colors">
                    <CheckCircle2 size={26} />
                </button>

                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-800 leading-tight">{task.titulo}</p>
                        {task.creado_por === 'cliente' && (
                            <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Cliente</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                            <Building2 size={10}/> {task.empresa_nombre || 'General'}
                        </span>
                    </div>

                    {/* MOSTRAR OBSERVACIÓN SI EXISTE */}
                    {task.observacion && (
                        <div className="mt-3 bg-gray-50 p-2.5 rounded-xl flex gap-2 items-start">
                            <MessageSquare size={12} className="text-gray-300 mt-0.5" />
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">{task.observacion}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;