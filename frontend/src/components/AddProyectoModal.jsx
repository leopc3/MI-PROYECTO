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
            const res = await axios.post('http://localhost:5000/api/proyectos', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onProyectoCreado(res.data);
        } catch (error) {
            console.error("Error al crear proyecto:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md md:max-w-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Nuevo Proyecto</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos de Nombre y Empresa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Proyecto</label>
                        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Empresa</label>
                        <select value={empresaId} onChange={e => setEmpresaId(e.target.value)} required className="input-style">
                            <option value="">Selecciona una empresa</option>
                            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                    </div>

                    {/* Checkbox de recurrencia */}
                    <div className="flex items-center">
                        <input type="checkbox" checked={esRecurrente} onChange={() => setEsRecurrente(!esRecurrente)} id="recurrente" className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
                        <label htmlFor="recurrente" className="ml-2 block text-sm text-gray-900">¿Es un proyecto recurrente?</label>
                    </div>

                    {/* Lógica condicional: O días recurrentes O fecha de finalización */}
                    {esRecurrente ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Repetir los días</label>
                            <div className="flex justify-between">
                                {diasSemana.map(dia => (
                                    <button 
                                        type="button" 
                                        key={dia.value} 
                                        onClick={() => handleDiaClick(dia.value)}
                                        className={`w-10 h-10 rounded-full font-bold transition-colors ${diasRecurrentes.includes(dia.value) ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                        {dia.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha de Finalización</label>
                            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} required={!esRecurrente} className="input-style"/>
                        </div>
                    )}
                    
                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Observación</label>
                        <textarea value={observacion} onChange={e => setObservacion(e.target.value)} rows="2" className="input-style"></textarea>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar Proyecto</button>
                    </div>
                </form>
            </div>
            {/* Pequeño CSS para no repetir clases */}
            <style>{`
                .input-style { margin-top: 4px; width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); outline: none; }
                .input-style:focus { ring: 2px; border-color: #2563eb; }
                .btn-primary { padding: 8px 16px; background-color: #2563eb; color: white; border-radius: 6px; }
                .btn-primary:hover { background-color: #1d4ed8; }
                .btn-secondary { padding: 8px 16px; background-color: #e5e7eb; color: #1f2937; border-radius: 6px; }
                .btn-secondary:hover { background-color: #d1d5db; }
            `}</style>
        </div>
    );
};

export default AddProyectoModal;