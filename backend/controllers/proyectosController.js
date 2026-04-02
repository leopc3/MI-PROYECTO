const pool = require('../db/database');

const obtenerProyectos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, e.nombre as empresa_nombre 
            FROM proyectos p 
            LEFT JOIN empresas e ON p.empresa_id = e.id 
            ORDER BY p.fecha_creacion DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearProyecto = async (req, res) => {
    const { empresa_id, nombre, es_recurrente, dias_recurrentes, fecha_fin, observacion, estado, observacion_estado } = req.body;
    try {
        // 1. Crear el proyecto
        const result = await pool.query(
            'INSERT INTO proyectos (empresa_id, nombre, es_recurrente, dias_recurrentes, fecha_fin, observacion, estado, observacion_estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [empresa_id, nombre, es_recurrente, dias_recurrentes, fecha_fin, observacion, estado || 'activo', observacion_estado || '']
        );
        const nuevoProyecto = result.rows[0];

        // 2. Si es recurrente y está ACTIVO, generar las tareas automáticamente para los próximos 6 meses
        if (es_recurrente && dias_recurrentes && dias_recurrentes.length > 0 && nuevoProyecto.estado === 'activo') {
            let actual = new Date();
            let limite = new Date();
            limite.setMonth(limite.getMonth() + 6); // Límite de 6 meses

            while (actual <= limite) {
                // getDay() devuelve 0(Dom), 1(Lun)...
                if (dias_recurrentes.includes(actual.getDay())) {
                    await pool.query(
                        'INSERT INTO tareas (proyecto_id, titulo, fecha_asignada, observacion) VALUES ($1, $2, $3, $4)',
                        [nuevoProyecto.id, `Tarea Rutinaria: ${nombre}`, actual.toISOString().split('T')[0], observacion]
                    );
                }
                actual.setDate(actual.getDate() + 1); // Avanzar un día
            }
        }

        res.json(nuevoProyecto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminarProyecto = async (req, res) => {
    const { id } = req.params;
    try {
        // Al eliminar el proyecto, las tareas se eliminan solas por el ON DELETE CASCADE de la BD
        await pool.query('DELETE FROM proyectos WHERE id = $1', [id]);
        res.json({ message: 'Proyecto y sus tareas eliminados' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Esta función es para tu cliente, usando el Enlace Dinámico (UUID)
const obtenerProyectoPorEnlace = async (req, res) => {
    const { uuid } = req.params;
    try {
        const proyectoReq = await pool.query('SELECT * FROM proyectos WHERE enlace_dinamico = $1', [uuid]);
        if (proyectoReq.rows.length === 0) return res.status(404).json({ message: 'Proyecto no encontrado' });
        
        const proyecto = proyectoReq.rows[0];
        
        // Traer las tareas de ese proyecto
        const tareasReq = await pool.query('SELECT * FROM tareas WHERE proyecto_id = $1 ORDER BY fecha_asignada ASC', [proyecto.id]);
        
        res.json({ proyecto, tareas: tareasReq.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const actualizarProyecto = async (req, res) => {
    const { id } = req.params;
    const { nombre, observacion, estado, observacion_estado } = req.body;
    try {
        const result = await pool.query(
            'UPDATE proyectos SET nombre = $1, observacion = $2, estado = $3, observacion_estado = $4 WHERE id = $5 RETURNING *',
            [nombre, observacion, estado || 'activo', observacion_estado || null, id]
        );
        res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { obtenerProyectos, crearProyecto, eliminarProyecto, obtenerProyectoPorEnlace, actualizarProyecto };