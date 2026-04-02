import { useState } from 'react';
import axios from 'axios';

const AddEmpresaModal = ({ empresa, onClose, onEmpresaGuardada }) => {
    // Si recibe `empresa`, está en modo edición; si no, en modo creación
    const [nombre, setNombre] = useState(empresa?.nombre || '');
    const [notas, setNotas] = useState(empresa?.notas_ideas || '');
    const [saving, setSaving] = useState(false);

    const isEdit = !!empresa;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            let res;
            if (isEdit) {
                res = await axios.put(
                    `http://localhost:5000/api/empresas/${empresa.id}`,
                    { nombre, notas_ideas: notas },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } else {
                res = await axios.post(
                    'http://localhost:5000/api/empresas',
                    { nombre, notas_ideas: notas },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            }
            onEmpresaGuardada(res.data);
        } catch (error) {
            console.error('Error al guardar empresa:', error);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md md:max-w-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {isEdit ? 'Editar Empresa' : 'Nueva Empresa'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            className="mt-1 w-full px-3 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notas / Ideas</label>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={3}
                            className="mt-1 w-full px-3 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand resize-none"
                            placeholder="Ideas, observaciones, estrategias..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand text-white rounded-xl font-bold">
                            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar Empresa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmpresaModal;