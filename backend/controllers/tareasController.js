const pool = require('../db/database');

let tableChecked = false;
const ensureHoraColumn = async () => {
    if (tableChecked) return;
    try {
        await pool.query(`ALTER TABLE tareas ADD COLUMN IF NOT EXISTS hora VARCHAR(10);`);
        tableChecked = true;
    } catch (e) {
        console.error('Error ensuring hora column in tareas:', e.message);
    }
};

const obtenerTareasDashboard = async (req, res) => {
    try {
        await ensureHoraColumn();
        const result = await pool.query(`
            SELECT t.*, p.nombre as proyecto_nombre, e.nombre as empresa_nombre
            FROM tareas t
            LEFT JOIN proyectos p ON t.proyecto_id = p.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE t.estado = 'pendiente'
            ORDER BY t.fecha_asignada ASC, (t.hora IS NULL) ASC, t.hora ASC, t.id ASC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const obtenerHistorialTareas = async (req, res) => {
    try {
        await ensureHoraColumn();
        const result = await pool.query(`
            SELECT t.*, p.nombre as proyecto_nombre,
                   e.nombre as empresa_nombre, e.id as empresa_id_real
            FROM tareas t
            LEFT JOIN proyectos p ON t.proyecto_id = p.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE t.estado = 'cumplida'
            ORDER BY t.fecha_cumplida DESC, (t.hora IS NULL) ASC, t.hora ASC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearTarea = async (req, res) => {
    const { proyecto_id, titulo, fecha_asignada, observacion, creado_por, hora } = req.body;
    try {
        await ensureHoraColumn();
        const result = await pool.query(
            'INSERT INTO tareas (proyecto_id, titulo, fecha_asignada, observacion, creado_por, hora) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [proyecto_id || null, titulo, fecha_asignada, observacion || null, creado_por || 'admin', hora || null]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const actualizarTarea = async (req, res) => {
    const { id } = req.params;
    const { titulo, fecha_asignada, observacion, proyecto_id, hora } = req.body;
    try {
        await ensureHoraColumn();
        const result = await pool.query(
            'UPDATE tareas SET titulo = $1, fecha_asignada = $2, observacion = $3, proyecto_id = $4, hora = $5 WHERE id = $6 RETURNING *',
            [titulo, fecha_asignada, observacion || null, proyecto_id || null, hora || null, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const marcarCumplida = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE tareas SET estado = 'cumplida', fecha_cumplida = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
            [id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminarTarea = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tareas WHERE id = $1', [id]);
        res.json({ message: 'Tarea eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    obtenerTareasDashboard,
    obtenerHistorialTareas,
    crearTarea,
    actualizarTarea,
    marcarCumplida,
    eliminarTarea
};