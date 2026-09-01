const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db/database');

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

// Usar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/deudas', deudasRoutes);

app.get('/', (req, res) => {
  res.send('API de Ventas Ya funcionando 🚀');
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🔥 Servidor corriendo en el puerto ${PORT}`));
}

// Para Vercel (serverless)
module.exports = app;