const express = require('express')
const router = express.Router()
const ejs = require('ejs')
const controller = require('../controllers/controlador')
const Sequelize = require('sequelize');
const seq = require('../src/config/db/config')



router.get('/historial_doc', controller.historialDoc)

router.get('/', controller.tipoTramite)

router.get('/documentos/:id', controller.tramitePag)

router.get("/commit", controller.commit);

router.get('/documento', (req, res) => {
    res.render('documentos')
})

router.get('/Crud', controller.cargarFormReserva);

router.post('/Crud', controller.CrearReserva);

router.get('/historialReservas', controller.ListarReservas);

router.post('/historialReservas/:id', controller.EliminarReservas);

router.get('/modificarReserva/:id', controller.FormReserva)

router.post('/modificarReserva/:id', controller.ModificarReservas);

router.get('/generar_documento', controller.generar_documento);

router.get('/documento_pdf', controller.get_documento_pdf);

module.exports = router;
