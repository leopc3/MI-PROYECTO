import { useState, useEffect } from 'react';

const MonthCalendar = ({ selectedDate, setSelectedDate, tareasPorDia = {} }) => {
    const [diasMes, setDiasMes] = useState([]);
    
    // Obtener días del mes actual de la fecha seleccionada
    useEffect(() => {
        const agruparMes = () => {
            const año = selectedDate.getFullYear();
            const mes = selectedDate.getMonth();
            const primerDia = new Date(año, mes, 1);
            const ultimoDia = new Date(año, mes + 1, 0);
            
            const dias = [];
            // Rellenar espacios en blanco del principio
            for (let i = 0; i < primerDia.getDay(); i++) {
                dias.push(null);
            }
            // Llenar el mes
            for (let i = 1; i <= ultimoDia.getDate(); i++) {
                dias.push(new Date(año, mes, i));
            }
            setDiasMes(dias);
        };
        agruparMes();
    }, [selectedDate]);

    const diaNombres = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

    return (
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            {/* Controles de mes */}
            <div className="flex justify-between items-center mb-3 px-2">
                <button 
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    className="font-bold text-gray-400 p-2"
                >
                    &lt;
                </button>
                <div className="font-black text-brand capitalize">
                    {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </div>
                <button 
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    className="font-bold text-gray-400 p-2"
                >
                    &gt;
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {diaNombres.map((n, i) => (
                    <div key={i} className="text-center text-[10px] font-black uppercase text-gray-400 mb-1">{n}</div>
                ))}
                
                {diasMes.map((d, index) => {
                    if (!d) return <div key={index} className="p-2"></div>;
                    
                    const isSelected = d.toDateString() === selectedDate.toDateString();
                    const isToday = d.toDateString() === new Date().toDateString();
                    const dateStr = d.toISOString().split('T')[0];
                    const numTareas = tareasPorDia[dateStr] || 0;

                    return (
                        <div 
                            key={index}
                            onClick={() => setSelectedDate(d)}
                            className={`relative flex items-center justify-center h-10 rounded-xl cursor-pointer transition-all
                                ${isSelected ? 'bg-brand text-white shadow-md font-bold' 
                                  : isToday ? 'bg-orange-50 text-brand font-bold' 
                                  : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <span>{d.getDate()}</span>
                            {numTareas > 0 && !isSelected && (
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand rounded-full"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthCalendar;
