const pool = require('../db/database');

// Helper: limpia montos con coma decimal ('500,00' → 500.00)
const parseMonto = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'string') val = val.replace(/,/g, '.').trim();
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

const obtenerDeudas = async (req, res) => {
    try {
        const { estado } = req.query; // 'activa' | 'completada' | undefined (todas)
        let query = `
            SELECT d.*, e.nombre as empresa_nombre
            FROM deudas d
            LEFT JOIN empresas e ON d.empresa_id = e.id
        `;
        const params = [];
        if (estado) {
            query += ' WHERE d.estado = $1';
            params.push(estado);
        }
        query += ' ORDER BY d.fecha_creacion DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearDeuda = async (req, res) => {
    const { concepto, monto_total, observacion, empresa_id } = req.body;
    const montoLimpio = parseMonto(monto_total);
    if (montoLimpio <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    try {
        const result = await pool.query(
            "INSERT INTO deudas (concepto, monto_total, observacion, empresa_id, estado) VALUES ($1, $2, $3, $4, 'activa') RETURNING *",
            [concepto, montoLimpio, observacion, empresa_id || null]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminarDeuda = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM historial_deudas WHERE deuda_id = $1', [id]);
        await pool.query('DELETE FROM deudas WHERE id = $1', [id]);
        res.json({ message: 'Deuda eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const registrarAjusteDeuda = async (req, res) => {
    const { id } = req.params;
    const { tipo, monto, observacion } = req.body;
    const montoLimpio = parseMonto(monto);

    if (montoLimpio <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    if (!['aumento', 'disminucion'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });

    try {
        await pool.query('BEGIN');

        // Registrar en historial
        await pool.query(
            'INSERT INTO historial_deudas (deuda_id, tipo, monto, observacion) VALUES ($1, $2, $3, $4)',
            [id, tipo, montoLimpio, observacion]
        );

        // Calcular nuevo saldo
        const operacion = tipo === 'aumento' ? '+' : '-';
        const result = await pool.query(
            `UPDATE deudas SET monto_total = monto_total ${operacion} $1 WHERE id = $2 RETURNING *`,
            [montoLimpio, id]
        );

        const deudaActualizada = result.rows[0];

        // Auto-completar si el saldo llegó a 0 o menos
        if (parseFloat(deudaActualizada.monto_total) <= 0) {
            await pool.query(
                "UPDATE deudas SET monto_total = 0, estado = 'completada' WHERE id = $1",
                [id]
            );
            deudaActualizada.monto_total = 0;
            deudaActualizada.estado = 'completada';
        }

        await pool.query('COMMIT');
        res.json(deudaActualizada);
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
};

const completarDeuda = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE deudas SET estado = 'completada' WHERE id = $1 RETURNING *",
            [id]
        );
        res.json(result.rows[0]);
    } catch (error) {
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
    registrarAjusteDeuda, completarDeuda, obtenerHistorialDeuda
};