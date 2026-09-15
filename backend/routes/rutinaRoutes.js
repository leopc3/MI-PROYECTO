const express = require('express');
const router = express.Router();
const { obtenerOCrearHoy, marcarGym, toggleEjercicio, completarRutina } = require('../controllers/rutinaController');

router.get('/hoy', obtenerOCrearHoy);
router.patch('/:id/gym', marcarGym);
router.patch('/:id/ejercicio', toggleEjercicio);
router.patch('/:id/completar', completarRutina);

module.exports = router;
