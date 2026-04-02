const pool = require('../db/database');

const obtenerTareasDashboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*, p.nombre as proyecto_nombre, e.nombre as empresa_nombre
            FROM tareas t
            LEFT JOIN proyectos p ON t.proyecto_id = p.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE t.estado = 'pendiente'
            ORDER BY t.fecha_asignada ASC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const obtenerHistorialTareas = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*, p.nombre as proyecto_nombre,
                   e.nombre as empresa_nombre, e.id as empresa_id_real
            FROM tareas t
            LEFT JOIN proyectos p ON t.proyecto_id = p.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE t.estado = 'cumplida'
            ORDER BY t.fecha_cumplida DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearTarea = async (req, res) => {
    const { proyecto_id, titulo, fecha_asignada, observacion, creado_por } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tareas (proyecto_id, titulo, fecha_asignada, observacion, creado_por) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [proyecto_id || null, titulo, fecha_asignada, observacion, creado_por || 'admin']
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const actualizarTarea = async (req, res) => {
    const { id } = req.params;
    const { titulo, fecha_asignada, observacion, proyecto_id } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tareas SET titulo = $1, fecha_asignada = $2, observacion = $3, proyecto_id = $4 WHERE id = $5 RETURNING *',
            [titulo, fecha_asignada, observacion, proyecto_id || null, id]
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