const pool = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;



    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

        let user;
        let validPassword = false;

        if (result.rows.length === 0) {
            // Si el admin no existe (base de datos reseteada), auto-crearlo
            if (email === 'admin@ventasya.com' && password === 'admin123') {
                const newHash = await bcrypt.hash(password, 10);
                const insert = await pool.query(
                    "INSERT INTO usuarios (nombre, email, password) VALUES ('Admin', $1, $2) RETURNING *",
                    [email, newHash]
                );
                user = insert.rows[0];
                validPassword = true;
            } else {
                return res.status(401).json({ message: 'Usuario no encontrado' });
            }
        } else {
            user = result.rows[0];
            
            // Check if the stored password is a valid bcrypt hash
            const isHash = user.password && user.password.startsWith('$2') && user.password.length === 60;
            
            if (isHash) {
                validPassword = await bcrypt.compare(password, user.password);
            } else {
                validPassword = false;
            }

            // Mecanismo de Auto-Sanación de BD para Claves en texto plano
            if (!validPassword && password === user.password) {
                validPassword = true;
                const newHash = await bcrypt.hash(password, 10);
                await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [newHash, user.id]);
            }
        }

        if (!validPassword) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: { id: user.id, nombre: user.nombre, email: user.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Ruta de emergencia para resetear la contraseña del admin
const resetAdminPassword = async (req, res) => {
    try {
        const newHash = await bcrypt.hash('admin123', 10);
        const result = await pool.query(
            "UPDATE usuarios SET password = $1 WHERE email = 'admin@ventasya.com' RETURNING id, email",
            [newHash]
        );
        if (result.rowCount === 0) {
            // Si no existe, crear el usuario
            const insert = await pool.query(
                "INSERT INTO usuarios (nombre, email, password) VALUES ('Admin', 'admin@ventasya.com', $1) RETURNING id, email",
                [newHash]
            );
            return res.json({ ok: true, action: 'created', user: insert.rows[0] });
        }
        res.json({ ok: true, action: 'reset', user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = { login, resetAdminPassword };