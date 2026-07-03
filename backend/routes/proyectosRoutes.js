const express = require('express');
const router = express.Router();
const { obtenerProyectos, crearProyecto, eliminarProyecto, obtenerProyectoPorEnlace, actualizarProyecto, regenerarTareas } = require('../controllers/proyectosController');

router.get('/', obtenerProyectos);
router.post('/', crearProyecto);
router.delete('/:id', eliminarProyecto);
// Ruta pública para el cliente:
router.get('/enlace/:uuid', obtenerProyectoPorEnlace);
router.put('/actualizar/:id', actualizarProyecto);
router.post('/:id/regenerar-tareas', regenerarTareas);

module.exports = router;