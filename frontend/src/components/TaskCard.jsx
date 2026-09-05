import { CheckCircle2, MessageSquare, Building2 } from 'lucide-react';
import axios from 'axios';

const TaskCard = ({ task, onCompleted }) => {
    const handleComplete = async () => {
        try {
            await axios.patch(`/api/tareas/${task.id}/estado`);
            onCompleted(task.id);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-3 animate-in fade-in slide-in-from-right-4 transition-colors">
            <div className="flex gap-4">
                {/* Botón de Cumplir */}
                <button onClick={handleComplete} className="mt-1 text-gray-200 dark:text-gray-700 hover:text-green-500 transition-colors">
                    <CheckCircle2 size={26} />
                </button>

                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{task.titulo}</p>
                        {task.creado_por === 'cliente' && (
                            <span className="bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Cliente</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 font-bold">
                            <Building2 size={10}/> {task.empresa_nombre || 'General'}
                        </span>
                    </div>

                    {/* MOSTRAR OBSERVACIÓN SI EXISTE */}
                    {task.observacion && (
                        <div className="mt-3 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl flex gap-2 items-start border border-transparent dark:border-gray-800">
                            <MessageSquare size={12} className="text-gray-300 dark:text-gray-600 mt-0.5" />
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed italic">{task.observacion}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;