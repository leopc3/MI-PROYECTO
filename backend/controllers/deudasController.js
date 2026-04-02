const pool = require('../db/database');

const obtenerDeudas = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, e.nombre as empresa_nombre
            FROM deudas d
            LEFT JOIN empresas e ON d.empresa_id = e.id
            ORDER BY d.fecha_creacion DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearDeuda = async (req, res) => {
    const { concepto, monto_total, observacion, empresa_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO deudas (concepto, monto_total, observacion, empresa_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [concepto, monto_total, observacion, empresa_id || null]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminarDeuda = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM deudas WHERE id = $1', [id]);
        res.json({ message: 'Deuda eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const registrarAjusteDeuda = async (req, res) => {
    const { id } = req.params;
    const { tipo, monto, observacion } = req.body; // tipo: 'aumento' o 'disminucion'
    try {
        await pool.query('BEGIN');
        await pool.query(
            'INSERT INTO historial_deudas (deuda_id, tipo, monto, observacion) VALUES ($1, $2, $3, $4)',
            [id, tipo, monto, observacion]
        );
        const operacion = tipo === 'aumento' ? '+' : '-';
        const result = await pool.query(
            `UPDATE deudas SET monto_total = monto_total ${operacion} $1 WHERE id = $2 RETURNING *`,
            [monto, id]
        );
        await pool.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
};

const obtenerHistorialDeuda = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM historial_deudas WHERE deuda_id = $1 ORDER BY fecha_registro DESC',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    obtenerDeudas, crearDeuda, eliminarDeuda,
    registrarAjusteDeuda, obtenerHistorialDeuda
};