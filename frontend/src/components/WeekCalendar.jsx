import { useState, useEffect } from 'react';

const WeekCalendar = ({ selectedDate, setSelectedDate }) => {
    const [week, setWeek] = useState([]);
    const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Calcula los 7 días de la semana que contiene `selectedDate`
    const buildWeek = (refDate) => {
        const days = [];
        const start = new Date(refDate);
        start.setDate(start.getDate() - start.getDay()); // retroceder al domingo
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    useEffect(() => {
        setWeek(buildWeek(selectedDate));
    }, [selectedDate]);

    // Auto-actualizar al llegar el domingo: si la fecha seleccionada quedó en la semana pasada
    // y hoy es domingo, avanzamos a la semana de hoy
    useEffect(() => {
        const today = new Date();
        const todayDateStr = today.toDateString();
        const weekDays = buildWeek(selectedDate);
        const inCurrentWeek = weekDays.some(d => d.toDateString() === todayDateStr);

        // Si hoy no está en la semana visible, actualizar al día de hoy
        if (!inCurrentWeek) {
            setSelectedDate(today);
        }

        // Verificar cada minuto si el día cambió (por si el app queda abierto todo el día)
        const interval = setInterval(() => {
            const now = new Date();
            const currentWeek = buildWeek(selectedDate);
            const todayInWeek = currentWeek.some(d => d.toDateString() === now.toDateString());
            if (!todayInWeek) {
                setSelectedDate(new Date());
            }
        }, 60 * 1000); // cada 60 segundos

        return () => clearInterval(interval);
    }, []); // solo al montar

    return (
        <div className="flex justify-between bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            {week.map((day, index) => {
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                    <div
                        key={index}
                        onClick={() => setSelectedDate(new Date(day))}
                        className={`flex flex-col items-center justify-center w-11 py-3 rounded-xl transition-all cursor-pointer select-none
                            ${isSelected
                                ? 'bg-brand text-white shadow-lg scale-105'
                                : isToday
                                    ? 'bg-blue-50 text-brand font-bold'
                                    : 'text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        <span className="text-[9px] font-black uppercase mb-1">{dayLabels[index]}</span>
                        <span className="text-sm font-bold">{day.getDate()}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default WeekCalendar;