const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
    obtenerDeudas, crearDeuda, eliminarDeuda,
    registrarAjusteDeuda, completarDeuda, obtenerHistorialDeuda
} = require('../controllers/deudasController');

router.get('/', verifyToken, obtenerDeudas);
router.post('/', verifyToken, crearDeuda);
router.delete('/:id', verifyToken, eliminarDeuda);
router.post('/:id/ajuste', verifyToken, registrarAjusteDeuda);
router.patch('/:id/completar', verifyToken, completarDeuda);
router.get('/:id/historial', verifyToken, obtenerHistorialDeuda);

module.exports = router;