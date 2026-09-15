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

let dbFixApplied = false;
const ensureDbFix = async () => {
    if (dbFixApplied) return;
    try {
        // Asegurar que el lunes 2026-09-14 quede registrado como gym
        await pool.query(`
            INSERT INTO rutina_sesiones (fecha, estado, ejercicios_completados)
            VALUES ('2026-09-14', 'gym', '{}'::jsonb)
            ON CONFLICT (fecha) DO UPDATE SET estado = 'gym';
        `);
        // Resetear el martes 2026-09-15 a pendiente (se había marcado por error)
        await pool.query(`
            UPDATE rutina_sesiones 
            SET estado = 'pendiente' 
            WHERE fecha = '2026-09-15' AND id = 1;
        `);
        dbFixApplied = true;
    } catch (e) {
        console.error('Error aplicando fix de rutina lunes/martes:', e.message);
    }
};

// GET /api/rutina?fecha=YYYY-MM-DD
const obtenerRutinas = async (req, res) => {
    try {
        await ensureDbFix();

        const fechaParam = req.query.fecha || (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();

        // Auto-crear todos los días de Lunes a Sábado de la semana (6 días de entrenamiento)
        const [y, m, d] = fechaParam.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay(); // 0=Dom, 1=Lun...
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const mondayDate = new Date(y, m - 1, d - daysSinceMonday);

        for (let i = 0; i < 6; i++) {
            const loopDate = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
            const loopStr = `${loopDate.getFullYear()}-${String(loopDate.getMonth()+1).padStart(2,'0')}-${String(loopDate.getDate()).padStart(2,'0')}`;
            await pool.query(`
                INSERT INTO rutina_sesiones (fecha, estado, ejercicios_completados)
                VALUES ($1, 'pendiente', $2)
                ON CONFLICT (fecha) DO NOTHING;
            `, [loopStr, JSON.stringify(EJERCICIOS_DEFAULT)]);
        }

        // Consultar últimos 60 días con to_char para evitar desfase de timezone
        const result = await pool.query(`
            SELECT id, to_char(fecha, 'YYYY-MM-DD') as fecha_str, estado, ejercicios_completados, created_at
            FROM rutina_sesiones
            WHERE fecha >= (CURRENT_DATE - INTERVAL '60 days')
            ORDER BY fecha DESC
        `);

        const todas = result.rows;
        const hoy = todas.find(r => r.fecha_str === fechaParam) || null;
        const retrasadas = todas.filter(r => r.fecha_str < fechaParam && r.estado === 'pendiente');

        res.json({
            todas,
            hoy,
            retrasadas,
            ...(hoy || {}) // compatibilidad
        });
    } catch (error) {
        console.error('Error en obtenerRutinas:', error);
        res.status(500).json({ error: error.message });
    }
};

const marcarGym = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE rutina_sesiones SET estado = 'gym' WHERE id = $1 RETURNING id, to_char(fecha, 'YYYY-MM-DD') as fecha_str, estado, ejercicios_completados, created_at",
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
            "UPDATE rutina_sesiones SET ejercicios_completados = $1 WHERE id = $2 RETURNING id, to_char(fecha, 'YYYY-MM-DD') as fecha_str, estado, ejercicios_completados, created_at",
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
            "UPDATE rutina_sesiones SET estado = 'rutina' WHERE id = $1 RETURNING id, to_char(fecha, 'YYYY-MM-DD') as fecha_str, estado, ejercicios_completados, created_at",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Sesion no encontrada' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resetearRutina = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE rutina_sesiones SET estado = 'pendiente' WHERE id = $1 RETURNING id, to_char(fecha, 'YYYY-MM-DD') as fecha_str, estado, ejercicios_completados, created_at",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Sesion no encontrada' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerRutinas, marcarGym, toggleEjercicio, completarRutina, resetearRutina };

