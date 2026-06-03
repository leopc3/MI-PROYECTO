import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Calendar, CheckCircle2, Plus, Filter, AlertTriangle, Download, Pencil, Eye, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ClienteView = () => {
    const { uuid } = useParams();
    const [proyecto, setProyecto] = useState(null);
    const [tareas, setTareas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevaTarea, setNuevaTarea] = useState({ titulo: '', fecha: '' });
    const [filtro, setFiltro] = useState('pendientes'); // 'pendientes' | 'todas' | 'retrasadas' | 'fecha'
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [mostrarCompletadas, setMostrarCompletadas] = useState(false);

    // Estado para editar tarea
    const [editando, setEditando] = useState(null); // { id, titulo, observacion, fecha_asignada }

    const loadData = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/proyectos/enlace/${uuid}`);
            setProyecto(res.data.proyecto);
            setTareas(res.data.tareas.sort((a, b) => new Date(a.fecha_asignada) - new Date(b.fecha_asignada)));
        } catch (err) { console.error("Enlace no válido"); }
    };

    useEffect(() => { loadData(); }, [uuid]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/tareas', {
                proyecto_id: proyecto.id,
                titulo: nuevaTarea.titulo,
                fecha_asignada: nuevaTarea.fecha,
                creado_por: 'cliente'
            });
            setIsModalOpen(false);
            setNuevaTarea({ titulo: '', fecha: '' });
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleEditTask = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5000/api/tareas/${editando.id}`, {
                titulo: editando.titulo,
                observacion: editando.observacion,
                fecha_asignada: editando.fecha_asignada,
            });
            setEditando(null);
            loadData();
        } catch (err) { console.error(err); }
    };

    const toggleComplete = async (id) => {
        if (proyecto.estado !== 'activo') {
            alert('El proyecto no está activo. No puedes modificar tareas.');
            return;
        }
        await axios.patch(`http://localhost:5000/api/tareas/${id}/estado`);
        loadData();
    };

    if (!proyecto) return <div className="p-10 text-center font-bold text-gray-400">Cargando proyecto...</div>;

    const hoyStr = new Date().toISOString().split('T')[0];

    const tareasFiltradas = tareas.filter(t => {
        const fechaT = t.fecha_asignada?.split('T')[0];

        // Ocultar completadas si el toggle está apagado
        if (!mostrarCompletadas && t.estado === 'cumplida') return false;

        if (filtro === 'retrasadas' && (fechaT >= hoyStr || t.estado === 'cumplida')) return false;

        if (filtro === 'fecha') {
            if (fechaDesde && fechaT < fechaDesde) return false;
            if (fechaHasta && fechaT > fechaHasta) return false;
        }

        return true;
    });

    const totalCompletadas = tareas.filter(t => t.estado === 'cumplida').length;

    const handleDownloadReport = () => {
        const doc = new jsPDF();
        doc.setFillColor(249, 115, 22);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("Reporte de Proyecto", 14, 20);
        doc.setFontSize(12);
        doc.text(proyecto.nombre, 14, 30);
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 50);
        doc.text(`Estado actual: ${proyecto.estado.toUpperCase()}`, 14, 58);
        let filtroTxt = "Mostrando: Todas las tareas";
        if (filtro === 'retrasadas') filtroTxt = "Mostrando: Tareas Retrasadas";
        if (filtro === 'fecha') {
            if (fechaDesde && fechaHasta) filtroTxt = `Mostrando del ${fechaDesde} al ${fechaHasta}`;
            else if (fechaDesde) filtroTxt = `Mostrando desde el ${fechaDesde}`;
            else if (fechaHasta) filtroTxt = `Mostrando hasta el ${fechaHasta}`;
        }
        doc.text(filtroTxt, 14, 66);
        const tableBody = tareasFiltradas.map(t => [
            new Date(t.fecha_asignada).toLocaleDateString(),
            t.titulo,
            t.creado_por === 'cliente' ? 'Cliente' : 'Agencia',
            t.estado === 'cumplida' ? 'Completado' : 'Pendiente'
        ]);
        doc.autoTable({
            startY: 74,
            head: [['Fecha', 'Tarea', 'Origen', 'Estado']],
            body: tableBody,
            headStyles: { fillColor: [249, 115, 22] },
            alternateRowStyles: { fillColor: [250, 245, 240] }
        });
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Reporte de cronología generado automáticamente.", 14, finalY);
        doc.save(`Reporte_${proyecto.nombre.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-3xl mx-auto bg-white min-h-screen pb-24 shadow-[0_0_40px_rgba(0,0,0,0.05)] border-x border-gray-100">
                {/* Header */}
                <div className={`p-8 md:p-12 text-white shadow-lg mb-8 transition-colors ${proyecto.estado === 'completado' ? 'bg-green-600' : proyecto.estado === 'pausado' ? 'bg-yellow-500' : 'bg-brand rounded-b-[40px]'}`}>
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">{proyecto.nombre}</h1>
                            <p className="opacity-80 text-sm mt-1 font-medium">Panel de Seguimiento y Actividades</p>
                            {proyecto.observacion && (
                                <p className="opacity-60 text-xs mt-2 italic max-w-sm">{proyecto.observacion}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleDownloadReport} className="bg-white text-brand px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2">
                                <Download size={16} /> REPORTE PDF
                            </button>
                            {proyecto.estado !== 'activo' && (
                                <div className="bg-white/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-sm self-start shrink-0">
                                    {proyecto.estado}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Observación de Estado (Si existe) */}
                {proyecto.observacion_estado && (
                    <div className="px-6 md:px-12 mb-8 -mt-4">
                        <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1.5">Mensaje de la agencia</p>
                            <p className="text-sm font-medium text-gray-700 italic">"{proyecto.observacion_estado}"</p>
                        </div>
                    </div>
                )}

                {/* Filtro de Tareas */}
                {tareas.length > 0 && (
                    <div className="px-6 md:px-12 mb-6 flex flex-col gap-3">
                        <div className="flex sm:items-center justify-between gap-4 flex-wrap">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Filter size={18} className="text-brand" /> Progreso de Tareas
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex bg-gray-100 p-1.5 rounded-xl">
                                    <button
                                        onClick={() => { setFiltro('pendientes'); setFechaDesde(''); setFechaHasta(''); }}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filtro === 'pendientes' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Pendientes
                                    </button>
                                    <button
                                        onClick={() => { setFiltro('retrasadas'); setFechaDesde(''); setFechaHasta(''); }}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${filtro === 'retrasadas' ? 'bg-red-50 shadow-sm text-red-600 border border-red-100' : 'text-gray-400 hover:text-red-400'}`}
                                    >
                                        <AlertTriangle size={14} /> Retrasadas
                                    </button>
                                </div>

                                <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-transparent focus-within:border-brand transition-colors flex-wrap sm:flex-nowrap">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mr-2 ml-2">Del</span>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(e) => {
                                            setFechaDesde(e.target.value);
                                            if (e.target.value || fechaHasta) setFiltro('fecha');
                                            else setFiltro('pendientes');
                                        }}
                                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer w-[110px]"
                                    />
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mx-2">Al</span>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(e) => {
                                            setFechaHasta(e.target.value);
                                            if (fechaDesde || e.target.value) setFiltro('fecha');
                                            else setFiltro('pendientes');
                                        }}
                                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer w-[110px]"
                                    />
                                    {(fechaDesde || fechaHasta) && (
                                        <button onClick={() => { setFechaDesde(''); setFechaHasta(''); setFiltro('pendientes'); }} className="ml-1 text-[10px] bg-red-100 text-red-500 rounded-md py-1 px-2 font-black hover:bg-red-200">
                                            X
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Toggle mostrar completadas */}
                        {totalCompletadas > 0 && (
                            <button
                                onClick={() => setMostrarCompletadas(!mostrarCompletadas)}
                                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors self-start"
                            >
                                {mostrarCompletadas ? <EyeOff size={14} /> : <Eye size={14} />}
                                {mostrarCompletadas ? `Ocultar completadas (${totalCompletadas})` : `Ver completadas (${totalCompletadas})`}
                            </button>
                        )}
                    </div>
                )}

                {/* Calendario Vertical */}
                <div className="px-6 md:px-12 relative">
                    {tareas.length === 0 ? (
                        <div className="text-center py-24 px-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-orange-100 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-2">¡Bienvenido a tu proyecto!</h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                Aún no tenemos actividades programadas. Si el proyecto está activo, puedes sugerir o solicitar tareas utilizando el botón flotante.
                            </p>
                        </div>
                    ) : tareasFiltradas.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 font-medium bg-green-50 rounded-3xl border border-green-100 flex flex-col items-center">
                            <CheckCircle2 size={32} className="text-green-400 mb-2" />
                            {filtro === 'retrasadas' ? '¡Felicidades! Todo está al día y no hay retrasos.' : '¡Todo completado! Usa el toggle para ver las tareas finalizadas.'}
                        </div>
                    ) : (
                        <>
                            {/* Línea central del tiempo */}
                            <div className="absolute left-[33px] md:left-[57px] top-4 bottom-4 w-0.5 bg-gray-100"></div>

                            <div className="space-y-8">
                                {tareasFiltradas.map((tarea) => {
                                    const fechaT = tarea.fecha_asignada?.split('T')[0];
                                    const isRetrasada = fechaT < hoyStr && tarea.estado !== 'cumplida';
                                    const esDCliente = tarea.creado_por === 'cliente';

                                    return (
                                        <div key={tarea.id} className="flex gap-4 relative z-10 transition-all hover:-translate-y-0.5">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${tarea.estado === 'cumplida' ? 'bg-green-500' : isRetrasada ? 'bg-red-500' : 'bg-brand'}`}>
                                                {isRetrasada && tarea.estado !== 'cumplida' ? <AlertTriangle size={16} className="text-white" /> : <Calendar size={16} className="text-white" />}
                                            </div>

                                            <div className={`flex-1 p-5 rounded-2xl border ${tarea.estado === 'cumplida' ? 'bg-gray-50 border-gray-100 opacity-60' : isRetrasada ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isRetrasada ? 'text-red-500' : 'text-brand'}`}>
                                                                {new Date(tarea.fecha_asignada).toLocaleDateString()}
                                                            </p>
                                                            {esDCliente ? (
                                                                <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md uppercase">Tu Petición</span>
                                                            ) : (
                                                                <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase">Agencia</span>
                                                            )}
                                                        </div>
                                                        <p className={`font-bold text-gray-800 text-base leading-snug ${tarea.estado === 'cumplida' ? 'line-through text-gray-400' : ''}`}>
                                                            {tarea.titulo}
                                                        </p>
                                                        {tarea.observacion && (
                                                            <p className={`text-sm mt-1 transition-all ${tarea.estado === 'cumplida' ? 'text-gray-400 line-through opacity-60' : 'text-gray-500 italic font-medium'}`}>
                                                                {tarea.observacion}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {/* Botón editar — solo tareas del cliente y proyecto activo */}
                                                        {esDCliente && proyecto.estado === 'activo' && tarea.estado !== 'cumplida' && (
                                                            <button
                                                                onClick={() => setEditando({
                                                                    id: tarea.id,
                                                                    titulo: tarea.titulo,
                                                                    observacion: tarea.observacion || '',
                                                                    fecha_asignada: tarea.fecha_asignada?.split('T')[0]
                                                                })}
                                                                className="p-1.5 rounded-full text-gray-300 hover:text-brand hover:bg-orange-50 transition-all"
                                                                title="Editar petición"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => toggleComplete(tarea.id)}
                                                            disabled={proyecto.estado !== 'activo'}
                                                            className={`p-1.5 rounded-full shrink-0 transition-all ${
                                                                tarea.estado === 'cumplida' ? 'text-green-500 hover:bg-green-50'
                                                                : proyecto.estado !== 'activo' ? 'text-gray-200 cursor-not-allowed'
                                                                : 'text-gray-300 hover:text-brand hover:bg-orange-50'
                                                            }`}
                                                            title={proyecto.estado !== 'activo' ? 'Bloqueado (Proyecto inactivo)' : 'Marcar tarea'}
                                                        >
                                                            <CheckCircle2 size={26} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Botón Flotante */}
                {proyecto.estado === 'activo' && (
                    <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 md:right-[calc(50%-24rem+1.5rem)] bg-brand text-white w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(249,115,22,0.4)] flex items-center justify-center z-50 transition-transform active:scale-90 hover:-translate-y-1">
                        <Plus size={30} />
                    </button>
                )}

                {/* Modal Añadir Tarea */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                        <form onSubmit={handleAddTask} className="bg-white w-full max-w-sm p-6 rounded-3xl space-y-4 shadow-2xl">
                            <h2 className="text-xl font-bold text-gray-800">Nueva Petición</h2>
                            <p className="text-sm text-gray-500 -mt-2 mb-4">Añade una tarea al proyecto y el equipo la priorizará.</p>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">¿Qué necesitas?</label>
                                <input type="text" placeholder="Ej. Modificar texto del banner..." required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-sm font-medium" onChange={e => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Para la fecha</label>
                                <input type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-sm font-medium text-gray-600" onChange={e => setNuevaTarea({ ...nuevaTarea, fecha: e.target.value })} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/30 hover:bg-orange-600">Enviar a Agencia</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Modal Editar Tarea */}
                {editando && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                        <form onSubmit={handleEditTask} className="bg-white w-full max-w-sm p-6 rounded-3xl space-y-4 shadow-2xl">
                            <h2 className="text-xl font-bold text-gray-800">Editar Petición</h2>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={editando.titulo}
                                    onChange={e => setEditando({ ...editando, titulo: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Observación (opcional)</label>
                                <textarea
                                    rows={3}
                                    value={editando.observacion}
                                    onChange={e => setEditando({ ...editando, observacion: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-sm font-medium resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={editando.fecha_asignada}
                                    onChange={e => setEditando({ ...editando, fecha_asignada: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-sm font-medium text-gray-600"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setEditando(null)} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/30 hover:bg-orange-600">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClienteView;