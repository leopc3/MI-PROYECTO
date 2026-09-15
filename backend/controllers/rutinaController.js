const pool = require('../db/database');

const EJERCICIOS_DEFAULT = {
    b1_archer: false,
    b1_hollow: false,
    b2_pistol: false,
    b2_bridge: false,
    b3_cobras: false,
    b3_rows: false,
    b4_emom: false
};

const obtenerOCrearHoy = async (req, res) => {
    try {
        const hoy = new Date();
        const diaSemana = hoy.getDay();
        if (diaSemana === 0) {
            return res.json({ domingo: true, mensaje: 'Hoy es domingo. Dia de descanso.' });
        }
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth()+1).padStart(2,'0');
        const day = String(hoy.getDate()).padStart(2,'0');
        const fechaStr = year + '-' + month + '-' + day;
        let result = await pool.query('SELECT * FROM rutina_sesiones WHERE fecha = $1', [fechaStr]);
        if (result.rows.length === 0) {
            result = await pool.query(
                'INSERT INTO rutina_sesiones (fecha, estado, ejercicios_completados) VALUES ($1, $2, $3) RETURNING *',
                [fechaStr, 'pendiente', JSON.stringify(EJERCICIOS_DEFAULT)]
            );
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const marcarGym = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE rutina_sesiones SET estado = 'gym' WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Sesion no encontrada' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleEjercicio = async (req, res) => {
    const { id } = req.params;
    const { ejercicio } = req.body;
    if (!Object.prototype.hasOwnProperty.call(EJERCICIOS_DEFAULT, ejercicio)) {
        return res.status(400).json({ error: 'Ejercicio no valido' });
    }
    try {
        const current = await pool.query('SELECT * FROM rutina_sesiones WHERE id = $1', [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'Sesion no encontrada' });
        const sesion = current.rows[0];
        const ejercicios = { ...EJERCICIOS_DEFAULT, ...sesion.ejercicios_completados };
        ejercicios[ejercicio] = !ejercicios[ejercicio];
        const result = await pool.query(
            'UPDATE rutina_sesiones SET ejercicios_completados = $1 WHERE id = $2 RETURNING *',
            [JSON.stringify(ejercicios), id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const completarRutina = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE rutina_sesiones SET estado = 'rutina' WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Sesion no encontrada' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerOCrearHoy, marcarGym, toggleEjercicio, completarRutina };
