const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const empresasRoutes = require('./routes/empresasRoutes');
const proyectosRoutes = require('./routes/proyectosRoutes');
const tareasRoutes = require('./routes/tareasRoutes');
const finanzasRoutes = require('./routes/finanzasRoutes');
const deudasRoutes = require('./routes/deudasRoutes');

// Usar Rutas (compatibilidad total: con y sin prefijo /api)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/empresas', empresasRoutes);
app.use('/empresas', empresasRoutes);

app.use('/api/proyectos', proyectosRoutes);
app.use('/proyectos', proyectosRoutes);

app.use('/api/tareas', tareasRoutes);
app.use('/tareas', tareasRoutes);

app.use('/api/finanzas', finanzasRoutes);
app.use('/finanzas', finanzasRoutes);

app.use('/api/deudas', deudasRoutes);
app.use('/deudas', deudasRoutes);

app.get(['/', '/api', '/api/health'], (req, res) => {
  res.json({ ok: true, message: 'API de Ventas Ya funcionando 🚀' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🔥 Servidor corriendo en el puerto ${PORT}`));
}

// Para Vercel (serverless)
module.exports = app;