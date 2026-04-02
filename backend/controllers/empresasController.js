const pool = require('../db/database');

const obtenerEmpresas = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM empresas ORDER BY fecha_creacion DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearEmpresa = async (req, res) => {
    const { nombre, notas_ideas } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO empresas (nombre, notas_ideas) VALUES ($1, $2) RETURNING *',
            [nombre, notas_ideas]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const actualizarEmpresa = async (req, res) => {
    const { id } = req.params;
    const { nombre, notas_ideas } = req.body;
    try {
        const result = await pool.query(
            'UPDATE empresas SET nombre = $1, notas_ideas = $2 WHERE id = $3 RETURNING *',
            [nombre, notas_ideas, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminarEmpresa = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM empresas WHERE id = $1', [id]);
        res.json({ message: 'Empresa eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { obtenerEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa };