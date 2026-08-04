const pool = require('../db/database');

// ─────────────────────────────────────────
// INGRESOS
// ─────────────────────────────────────────

const obtenerIngresos = async (req, res) => {
    try {
        const { empresa_id } = req.query;
        let query = `
            SELECT i.*, COALESCE(e.nombre, i.empresa_nombre_libre) as empresa_nombre
            FROM ingresos i
            LEFT JOIN empresas e ON i.empresa_id = e.id
        `;
        const params = [];
        if (empresa_id) {
            query += ' WHERE i.empresa_id = $1';
            params.push(empresa_id);
        }
        query += ' ORDER BY i.fecha_estimada ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearIngreso = async (req, res) => {
    // empresa_id para cobros normales, empresa_nombre para cobros rápidos
    const { empresa_id, empresa_nombre, monto, moneda, fecha_estimada, observacion, es_recurrente_mensual } = req.body;
    try {
        // Si no hay empresa_id, guardar como cobro rápido con nombre libre
        if (!empresa_id) {
            const result = await pool.query(
                'INSERT INTO ingresos (empresa_nombre_libre, monto, moneda, fecha_estimada, observacion, es_recurrente_mensual) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [empresa_nombre || 'Cobro rápido', monto, moneda || 'BOB', fecha_estimada, observacion, false]
            );
            return res.json(result.rows[0]);
        }

        const result = await pool.query(
            'INSERT INTO ingresos (empresa_id, monto, moneda, fecha_estimada, observacion, es_recurrente_mensual) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [empresa_id, monto, moneda || 'BOB', fecha_estimada, observacion, es_recurrente_mensual || false]
        );

        if (es_recurrente_mensual) {
            const fechaBase = new Date(fecha_estimada);
            for (let i = 1; i <= 11; i++) {
                const nuevaFecha = new Date(fechaBase);
                nuevaFecha.setMonth(nuevaFecha.getMonth() + i);
                await pool.query(
                    'INSERT INTO ingresos (empresa_id, monto, moneda, fecha_estimada, observacion, es_recurrente_mensual) VALUES ($1, $2, $3, $4, $5, $6)',
                    [empresa_id, monto, moneda || 'BOB', nuevaFecha.toISOString().split('T')[0], observacion, true]
                );
            }
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const actualizarIngreso = async (req, res) => {
    const { id } = req.params;
    const { empresa_id, monto, moneda, fecha_estimada, observacion } = req.body;
    try {
        const result = await pool.query(
            'UPDATE ingresos SET empresa_id=$1, monto=$2, moneda=$3, fecha_estimada=$4, observacion=$5 WHERE id=$6 RETURNING *',
            [empresa_id, monto, moneda || 'BOB', fecha_estimada, observacion, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminarIngreso = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM ingresos WHERE id=$1', [id]);
        res.json({ message: 'Ingreso eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleEstadoIngreso = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE ingresos SET estado = CASE WHEN estado = 'pendiente' THEN 'pagado' ELSE 'pendiente' END WHERE id=$1 RETURNING *",
            [id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────
// EGRESOS
// ─────────────────────────────────────────

const obtenerEgresos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM egresos ORDER BY fecha_pago ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearEgreso = async (req, res) => {
    const { monto, fecha_pago, es_recurrente_mensual, observacion, moneda } = req.body;
    try {
        // Insertar el primer egreso
        const result = await pool.query(
            'INSERT INTO egresos (monto, fecha_pago, es_recurrente_mensual, observacion, moneda) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [monto, fecha_pago, es_recurrente_mensual, observacion, moneda || 'BOB']
        );

        // Si es recurrente, auto-generar los próximos 11 meses (12 en total)
        if (es_recurrente_mensual) {
            const fechaBase = new Date(fecha_pago);
            for (let i = 1; i <= 11; i++) {
                const nuevaFecha = new Date(fechaBase);
                nuevaFecha.setMonth(nuevaFecha.getMonth() + i);
                await pool.query(
                    'INSERT INTO egresos (monto, fecha_pago, es_recurrente_mensual, observacion, moneda) VALUES ($1, $2, $3, $4, $5)',
                    [monto, nuevaFecha.toISOString().split('T')[0], true, observacion, moneda || 'BOB']
                );
            }
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const actualizarEgreso = async (req, res) => {
    const { id } = req.params;
    const { monto, fecha_pago, observacion, moneda } = req.body;
    try {
        const result = await pool.query(
            'UPDATE egresos SET monto=$1, fecha_pago=$2, observacion=$3, moneda=$4 WHERE id=$5 RETURNING *',
            [monto, fecha_pago, observacion, moneda || 'BOB', id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminarEgreso = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM egresos WHERE id=$1', [id]);
        res.json({ message: 'Egreso eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleEstadoEgreso = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE egresos SET estado = CASE WHEN estado = 'pendiente' THEN 'pagado' ELSE 'pendiente' END WHERE id=$1 RETURNING *",
            [id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────
// ACTUALIZAR SERIE RECURRENTE
// ─────────────────────────────────────────

// Actualiza este ingreso Y todos los futuros pendientes de la misma serie
const actualizarSerieIngreso = async (req, res) => {
    const { id } = req.params;
    const { empresa_id, monto, moneda, observacion } = req.body;
    try {
        // 1. Obtener el item actual para saber su fecha y empresa
        const current = await pool.query('SELECT * FROM ingresos WHERE id=$1', [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const item = current.rows[0];

        // 2. Actualizar este registro
        await pool.query(
            'UPDATE ingresos SET empresa_id=$1, monto=$2, moneda=$3, observacion=$4 WHERE id=$5',
            [empresa_id || item.empresa_id, monto, moneda || 'BOB', observacion, id]
        );

        // 3. Actualizar TODOS los futuros pendientes de la misma serie
        // Identificados por: mismo empresa_id, es_recurrente_mensual=true, estado pendiente, fecha >= hoy
        const hoy = new Date().toISOString().split('T')[0];
        const updated = await pool.query(
            `UPDATE ingresos
             SET monto=$1, moneda=$2, observacion=$3
             WHERE empresa_id=$4
               AND es_recurrente_mensual=true
               AND estado='pendiente'
               AND fecha_estimada > $5
             RETURNING id`,
            [monto, moneda || 'BOB', observacion, empresa_id || item.empresa_id, hoy]
        );

        res.json({ message: 'Serie actualizada', actualizados: updated.rowCount + 1 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualiza este egreso Y todos los futuros pendientes de la misma serie
const actualizarSerieEgreso = async (req, res) => {
    const { id } = req.params;
    const { monto, moneda, observacion } = req.body;
    try {
        // 1. Obtener item actual
        const current = await pool.query('SELECT * FROM egresos WHERE id=$1', [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const item = current.rows[0];

        // 2. Actualizar este registro
        await pool.query(
            'UPDATE egresos SET monto=$1, moneda=$2, observacion=$3 WHERE id=$4',
            [monto, moneda || 'BOB', observacion, id]
        );

        // 3. Actualizar todos los futuros pendientes con mismo observacion y recurrente
        const hoy = new Date().toISOString().split('T')[0];
        const updated = await pool.query(
            `UPDATE egresos
             SET monto=$1, moneda=$2, observacion=$3
             WHERE observacion=$4
               AND es_recurrente_mensual=true
               AND estado='pendiente'
               AND fecha_pago > $5
             RETURNING id`,
            [monto, moneda || 'BOB', observacion, item.observacion, hoy]
        );

        res.json({ message: 'Serie actualizada', actualizados: updated.rowCount + 1 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────
// ELIMINAR SERIE RECURRENTE
// ─────────────────────────────────────────

const eliminarSerieIngreso = async (req, res) => {
    const { id } = req.params;
    try {
        const current = await pool.query('SELECT * FROM ingresos WHERE id=$1', [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const item = current.rows[0];
        const hoy = new Date().toISOString().split('T')[0];

        // Eliminar este + todos los futuros pendientes de la misma empresa y recurrente
        const result = await pool.query(
            `DELETE FROM ingresos
             WHERE (id=$1)
             OR (empresa_id=$2 AND es_recurrente_mensual=true AND estado='pendiente' AND fecha_estimada >= $3)
             RETURNING id`,
            [id, item.empresa_id, hoy]
        );
        res.json({ message: 'Serie eliminada', eliminados: result.rowCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminarSerieEgreso = async (req, res) => {
    const { id } = req.params;
    try {
        const current = await pool.query('SELECT * FROM egresos WHERE id=$1', [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const item = current.rows[0];
        const hoy = new Date().toISOString().split('T')[0];

        // Eliminar este + todos los futuros pendientes con mismo observacion y recurrente
        const result = await pool.query(
            `DELETE FROM egresos
             WHERE (id=$1)
             OR (observacion=$2 AND es_recurrente_mensual=true AND estado='pendiente' AND fecha_pago >= $3)
             RETURNING id`,
            [id, item.observacion, hoy]
        );
        res.json({ message: 'Serie eliminada', eliminados: result.rowCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    obtenerIngresos, crearIngreso, actualizarIngreso, eliminarIngreso, toggleEstadoIngreso,
    obtenerEgresos, crearEgreso, actualizarEgreso, eliminarEgreso, toggleEstadoEgreso,
    actualizarSerieIngreso, actualizarSerieEgreso,
    eliminarSerieIngreso, eliminarSerieEgreso
};