import { useState } from 'react';
import axios from 'axios';

const AddProyectoModal = ({ empresas, onClose, onProyectoCreado }) => {
    const [nombre, setNombre] = useState('');
    const [empresaId, setEmpresaId] = useState('');
    const [esRecurrente, setEsRecurrente] = useState(false);
    const [diasRecurrentes, setDiasRecurrentes] = useState([]); // 0:Dom, 1:Lun...
    const [fechaFin, setFechaFin] = useState('');
    const [observacion, setObservacion] = useState('');

    const diasSemana = [
        { label: 'D', value: 0 }, { label: 'L', value: 1 }, { label: 'M', value: 2 }, 
        { label: 'M', value: 3 }, { label: 'J', value: 4 }, { label: 'V', value: 5 }, 
        { label: 'S', value: 6 }
    ];

    const handleDiaClick = (dia) => {
        if (diasRecurrentes.includes(dia)) {
            setDiasRecurrentes(diasRecurrentes.filter(d => d !== dia));
        } else {
            setDiasRecurrentes([...diasRecurrentes, dia]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            nombre,
            empresa_id: parseInt(empresaId),
            es_recurrente: esRecurrente,
            dias_recurrentes: esRecurrente ? diasRecurrentes : null,
            fecha_fin: !esRecurrente ? fechaFin : null,
            observacion
        };

        try {
            const res = await axios.post('/api/proyectos', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onProyectoCreado(res.data);
        } catch (error) {
            console.error("Error al crear proyecto:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md md:max-w-xl p-6 border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nuevo Proyecto</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos de Nombre y Empresa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Proyecto</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                            className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
                        <select
                            value={empresaId}
                            onChange={e => setEmpresaId(e.target.value)}
                            required
                            className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="">Selecciona una empresa</option>
                            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                    </div>

                    {/* Checkbox de recurrencia */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={esRecurrente}
                            onChange={() => setEsRecurrente(!esRecurrente)}
                            id="recurrente"
                            className="h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"
                        />
                        <label htmlFor="recurrente" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            ¿Es un proyecto recurrente?
                        </label>
                    </div>

                    {/* Lógica condicional: O días recurrentes O fecha de finalización */}
                    {esRecurrente ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repetir los días</label>
                            <div className="flex justify-between">
                                {diasSemana.map(dia => (
                                    <button 
                                        type="button" 
                                        key={dia.value} 
                                        onClick={() => handleDiaClick(dia.value)}
                                        className={`w-10 h-10 rounded-full font-bold transition-colors ${diasRecurrentes.includes(dia.value) ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        {dia.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Finalización</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={e => setFechaFin(e.target.value)}
                                required={!esRecurrente}
                                className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    )}
                    
                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observación</label>
                        <textarea
                            value={observacion}
                            onChange={e => setObservacion(e.target.value)}
                            rows="2"
                            className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="py-3 px-6 bg-brand hover:opacity-90 text-white font-bold rounded-xl transition-opacity">
                            Guardar Proyecto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProyectoModal;