const express = require('express');
const router = express.Router();
const { obtenerProyectos, crearProyecto, eliminarProyecto, obtenerProyectoPorEnlace,actualizarProyecto } = require('../controllers/proyectosController');

router.get('/', obtenerProyectos);
router.post('/', crearProyecto);
router.delete('/:id', eliminarProyecto);
// Ruta pública para el cliente:
router.get('/enlace/:uuid', obtenerProyectoPorEnlace);
router.put('/actualizar/:id', actualizarProyecto);

module.exports = router;