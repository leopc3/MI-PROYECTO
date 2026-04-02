import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, TrendingUp, TrendingDown, Calendar, Building2, Pencil, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import AddFinanzaModal from '../components/AddFinanzaModal';
import EditFinanzaModal from '../components/EditFinanzaModal';

const Finanzas = () => {
    const [tab, setTab] = useState('ingresos');
    const [data, setData] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [filtroEmpresa, setFiltroEmpresa] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // selector de mes
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const params = tab === 'ingresos' && filtroEmpresa ? `?empresa_id=${filtroEmpresa}` : '';
            const res = await axios.get(`http://localhost:5000/api/finanzas/${tab}${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchEmpresas = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/empresas');
            setEmpresas(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchData(); }, [tab, filtroEmpresa]);
    useEffect(() => { fetchEmpresas(); }, []);

    const handleEliminar = async (id) => {
        const tipo = tab === 'ingresos' ? 'ingreso' : 'egreso';
        if (!window.confirm(`¿Eliminar este ${tipo}?`)) return;
        try {
            await axios.delete(`http://localhost:5000/api/finanzas/${tab}/${id}`);
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handleToggleEstado = async (id, tipo) => {
        try {
            await axios.patch(`http://localhost:5000/api/finanzas/${tipo}s/${id}/estado`);
            fetchData();
        } catch (error) { console.error(error); }
    };

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const isIng = tab === 'ingresos';

    // Filtrar data por mes seleccionado
    const dataFiltrada = data.filter(item => {
        const dateStr = item.fecha_estimada || item.fecha_pago;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Calcular KPIs del mes TODO ingresos y egresos (requiere iterar el arrays por separado si tab está en uno solo, pero para el balance global del mes que funcione, necesito traer la otra data)
    // Para simplificar, si estamos en 'ingresos', sumamos 'ingresos' filtrados.
    const sumaMes = dataFiltrada.reduce((acc, curr) => {
        // Asumiendo que todo lo convertimos a BOB temporalmente o ignoramos la moneda en la UI para la suma básica (o solo sumamos USD si es USD)
        // Para exactitud omitimos conversión y sumamos bruto, pero un ERP real convertiría con tipo de cambio.
        return acc + parseFloat(curr.monto);
    }, 0);

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-black text-gray-800 mb-5 px-1">Finanzas</h1>

            {/* Selector Mensual y Resumen */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-5 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Resumen del Mes</span>
                    <input 
                        type="month" 
                        value={`${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`}
                        onChange={(e) => {
                            const [y, m] = e.target.value.split('-');
                            setSelectedYear(parseInt(y));
                            setSelectedMonth(parseInt(m) - 1);
                        }}
                        className="text-sm font-bold text-brand bg-orange-50 px-2 py-1 outline-none rounded-xl"
                    />
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <p className={`text-3xl font-black ${isIng ? 'text-green-500' : 'text-red-500'} tracking-tighter leading-none`}>
                            Bs. {sumaMes.toFixed(2)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Total {isIng ? 'Ingresos' : 'Egresos'} en este mes</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-200/60 p-1.5 rounded-2xl mb-5 backdrop-blur-sm">
                <button
                    onClick={() => { setTab('ingresos'); setFiltroEmpresa(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'ingresos' ? 'bg-white shadow-md text-green-600' : 'text-gray-500'}`}
                >
                    Ingresos (Cobros)
                </button>
                <button
                    onClick={() => { setTab('egresos'); setFiltroEmpresa(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'egresos' ? 'bg-white shadow-md text-red-600' : 'text-gray-500'}`}
                >
                    Egresos (Pagos)
                </button>
            </div>

            {/* Filtro por empresa (solo ingresos) */}
            {tab === 'ingresos' && (
                <div className="mb-4">
                    <select
                        value={filtroEmpresa}
                        onChange={e => setFiltroEmpresa(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-brand"
                    >
                        <option value="">Todas las empresas</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                </div>
            )}

            {/* Lista */}
            <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {dataFiltrada.length > 0 ? dataFiltrada.map(item => (
                    <div key={item.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-100 transition-all ${item.estado === 'pagado' ? 'opacity-70 bg-gray-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div 
                                onClick={() => handleToggleEstado(item.id, isIng ? 'ingreso' : 'egreso')}
                                className={`p-2.5 rounded-2xl shrink-0 cursor-pointer transition-transform hover:scale-110 shadow-sm ${item.estado === 'pagado' ? 'bg-green-100 text-green-600' : isIng ? 'bg-orange-50 text-green-500' : 'bg-red-50 text-red-500'}`}
                                title={item.estado === 'pagado' ? "Marcar como pendiente" : "Marcar como COMPLETADO"}
                            >
                                {item.estado === 'pagado' ? <CheckCircle2 size={24} /> : isIng ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            </div>
                            <div className={`flex-1 min-w-0 ${item.estado === 'pagado' ? 'line-through text-gray-400' : ''}`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-gray-800 truncate">
                                        {isIng ? item.empresa_nombre : (item.observacion || 'Gasto General')}
                                    </p>
                                    {!isIng && item.es_recurrente_mensual && (
                                        <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-brand/10 text-brand rounded-full uppercase">
                                            <RefreshCw size={8} /> Recurrente
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Calendar size={10} />
                                    {formatDate(item.fecha_estimada || item.fecha_pago)}
                                </p>
                                {isIng && item.observacion && (
                                    <p className="text-xs text-gray-400 italic mt-0.5 truncate">{item.observacion}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={`text-lg font-black ${item.estado === 'pagado' ? 'text-gray-400' : isIng ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.moneda === 'USD' ? '$' : 'Bs. '}{item.monto}
                                </span>
                                <div className="flex gap-1 mt-1">
                                    <button onClick={() => setEditItem(item)} className="p-1.5 rounded-xl bg-orange-50 text-brand active:scale-95 transition-all">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleEliminar(item.id)} className="p-1.5 rounded-xl bg-red-50 text-red-500 active:scale-95 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 text-gray-300 italic bg-white rounded-3xl border border-gray-100">
                        No hay registros en {new Date(selectedYear, selectedMonth).toLocaleDateString('es-ES', {month: 'long', year: 'numeric'})}.
                    </div>
                )}
            </div>

            {/* FAB */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className={`fixed bottom-24 right-5 w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl text-white transition-all active:scale-90 ${isIng ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'}`}
            >
                <Plus size={32} strokeWidth={3} />
            </button>

            {isAddModalOpen && (
                <AddFinanzaModal tab={tab} onClose={() => setIsAddModalOpen(false)} onSaved={fetchData} />
            )}

            {editItem && (
                <EditFinanzaModal
                    item={editItem}
                    tipo={tab === 'ingresos' ? 'ingreso' : 'egreso'}
                    onClose={() => setEditItem(null)}
                    onSaved={fetchData}
                />
            )}
        </div>
    );
};

export default Finanzas;