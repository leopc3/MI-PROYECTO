const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db/database');

const app = express();

app.use(cors());
app.use(express.json());

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const empresasRoutes = require('./routes/empresasRoutes');
const proyectosRoutes = require('./routes/proyectosRoutes'); // <--- NUEVO
const tareasRoutes = require('./routes/tareasRoutes');       // <--- NUEVO
const finanzasRoutes = require('./routes/finanzasRoutes');
const deudasRoutes = require('./routes/deudasRoutes');
// Usar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/proyectos', proyectosRoutes); // <--- NUEVO
app.use('/api/tareas', tareasRoutes);       // <--- NUEVO
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/deudas', deudasRoutes);

app.get('/', (req, res) => {
  res.send('API de Ventas Ya funcionando 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en el puerto ${PORT}`);
});