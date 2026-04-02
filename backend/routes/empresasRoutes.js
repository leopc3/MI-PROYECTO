const express = require('express');
const router = express.Router();
const { obtenerEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa } = require('../controllers/empresasController');

router.get('/', obtenerEmpresas);
router.post('/', crearEmpresa);
router.put('/:id', actualizarEmpresa);
router.delete('/:id', eliminarEmpresa);

module.exports = router;