import { useState } from 'react';
import axios from 'axios';
import { X, CheckCircle2, Circle, ChevronDown, ChevronUp, Trophy, Dumbbell } from 'lucide-react';

const BLOQUES = [
    {
        id: 'b1',
        titulo: 'Bloque 1 — Fuerza de Empuje / Core',
        duracion: '8-10 min · 3-4 rondas · 60s descanso',
        color: 'orange',
        ejercicios: [
            {
                key: 'b1_archer',
                nombre: 'Archer Push-ups / Flexiones Declinadas',
                detalle: '8-10 reps por lado (Archer) o 15 declinadas con pies en silla y pausa 2s en el fondo',
                objetivo: 'Carga unilateral en pectoral, tríceps y deltoides anterior con máxima tensión excéntrica',
            },
            {
                key: 'b1_hollow',
                nombre: 'Hollow Body Rocks / Hollow Hold',
                detalle: '45-60 segundos por ronda',
                objetivo: 'Tensión isométrica total de la pared abdominal y flexores sin impacto lumbar',
            },
        ],
    },
    {
        id: 'b2',
        titulo: 'Bloque 2 — Fuerza de Piernas',
        duracion: '8-10 min · 3 rondas · 60s descanso',
        color: 'blue',
        ejercicios: [
            {
                key: 'b2_pistol',
                nombre: 'Pistol Squats / Bulgarian Split Squats',
                detalle: '6-8 reps por pierna (Pistol) o 12 reps por pierna tempo 3-1-1 (bajar en 3s, pie trasero en silla)',
                objetivo: 'Tensión mecánica pura en cuádriceps y glúteos sin barra',
            },
            {
                key: 'b2_bridge',
                nombre: 'Single-leg Glute Bridge con elevación de talón',
                detalle: '12-15 reps por pierna, sosteniendo 2 segundos arriba en máxima contracción',
                objetivo: 'Activación máxima de glúteo e isquiotibial unilateral',
            },
        ],
    },
    {
        id: 'b3',
        titulo: 'Bloque 3 — Tracción y Cadena Posterior',
        duracion: '6 min · 3 series al fallo técnico',
        color: 'green',
        ejercicios: [
            {
                key: 'b3_cobras',
                nombre: 'Floor Prone Cobras / Batwings en suelo',
                detalle: 'Boca abajo, levanta torso y piernas, retrae escápulas llevando codos a las costillas. 15-20 reps aguantando 2s la contracción',
                objetivo: 'Activación de trapecio medio, romboides y cadena posterior alta',
            },
            {
                key: 'b3_rows',
                nombre: 'Doorframe Rows / Hamstring Curls con toalla',
                detalle: 'Pies sobre toalla en piso resbaloso, eleva cadera en puente y extiende/flexiona rodillas. 10-12 reps (avanzado: 1 sola pierna)',
                objetivo: 'Fuerza excéntrica de isquiotibiales y tracción escapular',
            },
        ],
    },
    {
        id: 'b4',
        titulo: 'Bloque 4 — Finisher Metabólico',
        duracion: '4-5 min · EMOM (Every Minute on the Minute)',
        color: 'red',
        ejercicios: [
            {
                key: 'b4_emom',
                nombre: 'EMOM 4 minutos: Sprawls + Jump Squats',
                detalle: 'Al inicio de cada minuto: 10 Sprawls/Burpees limpios (pecho al suelo + salto explosivo) + 15 Sentadillas con salto. El tiempo restante es tu descanso. Repite 4 veces.',
                objetivo: 'Vaciado metabólico final para compensar el día sedentario',
            },
        ],
    },
];

const colorMap = {
    orange: {
        header: 'bg-orange-500/20 border-orange-500/40',
        badge: 'bg-orange-500 text-white',
        check: 'text-orange-500',
        bar: 'bg-orange-500',
    },
    blue: {
        header: 'bg-blue-500/20 border-blue-500/40',
        badge: 'bg-blue-500 text-white',
        check: 'text-blue-500',
        bar: 'bg-blue-500',
    },
    green: {
        header: 'bg-green-500/20 border-green-500/40',
        badge: 'bg-green-500 text-white',
        check: 'text-green-500',
        bar: 'bg-green-500',
    },
    red: {
        header: 'bg-red-500/20 border-red-500/40',
        badge: 'bg-red-500 text-white',
        check: 'text-red-500',
        bar: 'bg-red-500',
    },
};

const RutinaModal = ({ sesion, onClose, onComplete }) => {
    const [ejercicios, setEjercicios] = useState(
        sesion?.ejercicios_completados || {
            b1_archer: false, b1_hollow: false,
            b2_pistol: false, b2_bridge: false,
            b3_cobras: false, b3_rows: false,
            b4_emom: false
        }
    );
    const [bloqueAbierto, setBloqueAbierto] = useState('b1');
    const [loading, setLoading] = useState(false);
    const [completing, setCompleting] = useState(false);

    const token = localStorage.getItem('token');

    const totalEjercicios = 7;
    const completados = Object.values(ejercicios).filter(Boolean).length;
    const porcentaje = Math.round((completados / totalEjercicios) * 100);
    const todoListo = completados === totalEjercicios;

    const handleToggle = async (key) => {
        if (loading) return;
        setLoading(true);
        const nuevo = { ...ejercicios, [key]: !ejercicios[key] };
        setEjercicios(nuevo); // optimista
        try {
            const res = await axios.patch(`/api/rutina/${sesion.id}/ejercicio`, { ejercicio: key }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEjercicios(res.data.ejercicios_completados);
        } catch (e) {
            setEjercicios(ejercicios); // revertir
        }
        setLoading(false);
    };

    const handleCompletar = async () => {
        setCompleting(true);
        try {
            await axios.patch(`/api/rutina/${sesion.id}/completar`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onComplete();
        } catch (e) { console.error(e); }
        setCompleting(false);
    };

    const bloqueCompletado = (bloque) =>
        bloque.ejercicios.every(e => ejercicios[e.key]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-gray-900 dark:bg-gray-950 w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-800">
                {/* Header */}
                <div className="sticky top-0 bg-gray-900 dark:bg-gray-950 z-10 px-5 pt-5 pb-3 border-b border-gray-800">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <Dumbbell size={22} className="text-orange-500" />
                            <h2 className="text-lg font-black text-white">Rutina en Casa</h2>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>
                    {/* Barra de progreso */}
                    <div className="mb-1 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">{completados}/{totalEjercicios} ejercicios</span>
                        <span className="text-xs font-black text-orange-400">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                        <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-500"
                            style={{ width: porcentaje + '%' }}
                        />
                    </div>
                </div>

                {/* Bloques */}
                <div className="p-4 space-y-3">
                    {BLOQUES.map((bloque) => {
                        const c = colorMap[bloque.color];
                        const abierto = bloqueAbierto === bloque.id;
                        const bCompleto = bloqueCompletado(bloque);
                        return (
                            <div key={bloque.id} className={`rounded-2xl border ${bCompleto ? 'border-green-500/50 bg-green-950/20' : 'border-gray-700 bg-gray-800/50'} overflow-hidden`}>
                                <button
                                    onClick={() => setBloqueAbierto(abierto ? null : bloque.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        {bCompleto
                                            ? <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                                            : <div className="w-5 h-5 rounded-full border-2 border-gray-600 shrink-0" />
                                        }
                                        <div>
                                            <p className={`text-sm font-black ${bCompleto ? 'text-green-400' : 'text-white'}`}>{bloque.titulo}</p>
                                            <p className="text-[10px] text-gray-500">{bloque.duracion}</p>
                                        </div>
                                    </div>
                                    {abierto ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                </button>

                                {abierto && (
                                    <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50 pt-3">
                                        {bloque.ejercicios.map((ej) => {
                                            const hecho = ejercicios[ej.key];
                                            return (
                                                <button
                                                    key={ej.key}
                                                    onClick={() => handleToggle(ej.key)}
                                                    className={`w-full text-left flex gap-3 p-3 rounded-xl border transition-all ${
                                                        hecho
                                                            ? 'bg-green-950/40 border-green-500/40'
                                                            : 'bg-gray-900/60 border-gray-700 hover:border-gray-500'
                                                    }`}
                                                >
                                                    <div className="shrink-0 mt-0.5">
                                                        {hecho
                                                            ? <CheckCircle2 size={20} className="text-green-400" />
                                                            : <Circle size={20} className="text-gray-600" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-sm ${hecho ? 'text-green-300 line-through' : 'text-white'}`}>
                                                            {ej.nombre}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">{ej.detalle}</p>
                                                        <p className="text-[10px] text-gray-600 mt-1 italic">🎯 {ej.objetivo}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-900 dark:bg-gray-950 p-4 border-t border-gray-800">
                    {todoListo ? (
                        <button
                            onClick={handleCompletar}
                            disabled={completing}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 active:scale-95 transition-all"
                        >
                            <Trophy size={20} />
                            {completing ? 'Guardando...' : '¡Completar Rutina!'}
                        </button>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm text-gray-500 font-medium">
                                Te faltan <span className="text-orange-400 font-black">{totalEjercicios - completados}</span> ejercicios para completar la rutina
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RutinaModal;
