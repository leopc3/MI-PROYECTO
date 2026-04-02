const express = require('express');
const router = express.Router();
const {
    obtenerTareasDashboard, obtenerHistorialTareas,
    crearTarea, actualizarTarea, marcarCumplida, eliminarTarea
} = require('../controllers/tareasController');

router.get('/dashboard', obtenerTareasDashboard);
router.get('/historial', obtenerHistorialTareas);   // ← bug fix: endpoint separado para cumplidas
router.post('/', crearTarea);
router.put('/:id', actualizarTarea);
router.patch('/:id/estado', marcarCumplida);
router.delete('/:id', eliminarTarea);

module.exports = router;