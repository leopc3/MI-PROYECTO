const express = require('express');
const router = express.Router();
const { obtenerRutinas, marcarGym, toggleEjercicio, completarRutina, resetearRutina } = require('../controllers/rutinaController');

router.get('/', obtenerRutinas);
router.get('/hoy', obtenerRutinas);
router.patch('/:id/gym', marcarGym);
router.patch('/:id/ejercicio', toggleEjercicio);
router.patch('/:id/completar', completarRutina);
router.patch('/:id/reset', resetearRutina);

module.exports = router;
