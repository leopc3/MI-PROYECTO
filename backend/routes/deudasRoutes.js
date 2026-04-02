const express = require('express');
const router = express.Router();
const {
    obtenerDeudas, crearDeuda, eliminarDeuda,
    registrarAjusteDeuda, obtenerHistorialDeuda
} = require('../controllers/deudasController');

router.get('/', obtenerDeudas);
router.post('/', crearDeuda);
router.delete('/:id', eliminarDeuda);
router.post('/:id/ajuste', registrarAjusteDeuda);
router.get('/:id/historial', obtenerHistorialDeuda);

module.exports = router;