import { useState, useEffect } from 'react';
import { Search, FolderKanban, CheckSquare, Building2, X } from 'lucide-react';
import axios from 'axios';

const GlobalSearchModal = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ tareas: [], proyectos: [], empresas: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults({ tareas: [], proyectos: [], empresas: [] });
            return;
        }
        
        const delaySearch = setTimeout(async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                // Para simplificar, buscamos todo en paralelo. (En apps muy pesadas habría un endpoint unificado o búsqueda indexada).
                const [tarRes, proyRes, empRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/tareas/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/proyectos', { headers: { 'Authorization': `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/empresas', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const q = query.toLowerCase();

                setResults({
                    tareas: tarRes.data.filter(t => t.titulo.toLowerCase().includes(q) || t.observacion?.toLowerCase().includes(q)),
                    proyectos: proyRes.data.filter(p => p.nombre.toLowerCase().includes(q)),
                    empresas: empRes.data.filter(e => e.nombre.toLowerCase().includes(q))
                });
            } catch (err) { console.error(err); }
            setLoading(false);
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [query]);

    // Redirección simple (en un modal cerramos y alertamos o enviamos a donde corresponde)
    const handleAction = (tipo, item) => {
        // En una app más integrada usarías useNavigate()
        alert(`Has seleccionado el ${tipo}: ${item.titulo || item.nombre}. Ve al módulo correspondiente para editarlo.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] p-4 pt-10" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md md:max-w-2xl mx-auto max-h-[80vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                
                {/* Header Búsqueda */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    <Search className="text-brand shrink-0" size={24} />
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Buscar tareas, proyectos o empresas..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="flex-1 outline-none text-lg text-gray-800 placeholder-gray-300"
                    />
                    <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Resultados */}
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
                    {query.length < 2 && (
                        <div className="text-center p-10 text-gray-400">Escribe al menos 2 letras...</div>
                    )}
                    
                    {loading && query.length >= 2 && (
                        <div className="text-center p-10 text-brand font-bold animate-pulse">Buscando...</div>
                    )}

                    {!loading && query.length >= 2 && results.empresas.length === 0 && results.proyectos.length === 0 && results.tareas.length === 0 && (
                        <div className="text-center p-10 text-gray-400">No hay resultados.</div>
                    )}

                    {!loading && query.length >= 2 && (
                        <div className="space-y-4 p-2">
                            {/* Empresas */}
                            {results.empresas.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2 px-2">Empresas</h3>
                                    <div className="space-y-1">
                                        {results.empresas.map(e => (
                                            <button key={e.id} onClick={() => handleAction('empresa', e)} className="w-full text-left flex items-center gap-3 p-3 bg-white rounded-xl active:bg-gray-50">
                                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Building2 size={16} /></div>
                                                <span className="font-bold text-gray-800">{e.nombre}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Proyectos */}
                            {results.proyectos.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2 px-2">Proyectos</h3>
                                    <div className="space-y-1">
                                        {results.proyectos.map(p => (
                                            <button key={p.id} onClick={() => handleAction('proyecto', p)} className="w-full text-left flex items-center gap-3 p-3 bg-white rounded-xl active:bg-gray-50">
                                                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><FolderKanban size={16} /></div>
                                                <span className="font-bold text-gray-800 truncate">{p.nombre}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tareas */}
                            {results.tareas.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2 px-2">Tareas Pendientes</h3>
                                    <div className="space-y-1">
                                        {results.tareas.map(t => (
                                            <button key={t.id} onClick={() => handleAction('tarea', t)} className="w-full text-left flex items-center gap-3 p-3 bg-white rounded-xl active:bg-gray-50">
                                                <div className="p-2 bg-green-50 text-green-500 rounded-lg"><CheckSquare size={16} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-gray-800 block truncate">{t.titulo}</span>
                                                    <span className="text-xs text-gray-400 truncate">{t.proyecto_nombre || 'General'}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GlobalSearchModal;
