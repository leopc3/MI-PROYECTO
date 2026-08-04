const express = require('express');
const router = express.Router();
const {
    obtenerIngresos, crearIngreso, actualizarIngreso, eliminarIngreso, toggleEstadoIngreso,
    obtenerEgresos, crearEgreso, actualizarEgreso, eliminarEgreso, toggleEstadoEgreso,
    actualizarSerieIngreso, actualizarSerieEgreso
} = require('../controllers/finanzasController');

// Ingresos
router.get('/ingresos', obtenerIngresos);
router.post('/ingresos', crearIngreso);
router.put('/ingresos/:id', actualizarIngreso);
router.put('/ingresos/:id/serie', actualizarSerieIngreso);
router.patch('/ingresos/:id/estado', toggleEstadoIngreso);
router.delete('/ingresos/:id', eliminarIngreso);

// Egresos
router.get('/egresos', obtenerEgresos);
router.post('/egresos', crearEgreso);
router.put('/egresos/:id', actualizarEgreso);
router.put('/egresos/:id/serie', actualizarSerieEgreso);
router.patch('/egresos/:id/estado', toggleEstadoEgreso);
router.delete('/egresos/:id', eliminarEgreso);

module.exports = router;