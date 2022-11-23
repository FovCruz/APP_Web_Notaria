const Sequelize = require('sequelize');
const seq = require('../src/config/db/config')
const ejs = require('ejs')
const asyncHandler = require("../utils/async_handler");
const { response } = require('express');
const WebpayPlus = require("transbank-sdk").WebpayPlus;
const pdf = require('pdfkit');
const { Request } = require('tedious');
const jspdf = require('jspdf');
const signature_pad = require('signature_pad');





//**************************************************************************************************************************
exports.tipoTramite = asyncHandler(async function (request, response){
  const tramite = await seq.query('select * from tipo_tramite', { type: Sequelize.QueryTypes.SELECT })   
  response.render('inicio',{tramite})
});
//**************************************************************************************************************************
exports.historialDoc = asyncHandler(async function (request, response, next){
    //let documentos = await seq.query('EXEC sp_historial_doc', { type: Sequelize.QueryTypes.SELECT })
    let documentos = await seq.query('select * from doc_emitido', { type: Sequelize.QueryTypes.SELECT })

    //const tramite = await seq.query(`select * from doc_emitido where cod_tramite = ${id} `, { type: Sequelize.QueryTypes.SELECT })
    const newDoc = documentos.map(d => {
        const doc64 = Buffer.from(d.copia_documento).toString('base64')
        delete d.copia_documento
        return {
            ...d, doc64
        }
    })
    response.render('historial_documentos', {newDoc})
});
//************************************************************************************************************************** */
exports.tramitePag = asyncHandler(async function (request, response){
    const{id} = request.params 
    const tramite = await seq.query(`select * from tipo_tramite where cod_tramite = ${id} `, { type: Sequelize.QueryTypes.SELECT })
    let buyOrder = "O-" + Math.floor(Math.random() * 10000) + 1;
    let sessionId = "S-" + Math.floor(Math.random() * 10000) + 1;
    let amount = tramite[0].precio;
    let returnUrl =
        request.protocol + "://" + request.get("host") + "/webpay_plus/commit";

    const createResponse = await (new WebpayPlus.Transaction()).create(
        buyOrder,
        sessionId,
        amount,
        returnUrl
    );

    let token = createResponse.token;
    let url = createResponse.url;

    let viewData = {
        buyOrder,
        sessionId,
        amount,
        returnUrl,
        token,
        url,
    };
    
    response.render('documentos',{tramite, viewData})   
});
//**************************************************************************************************************************
exports.commit = asyncHandler(async function (request, response, next) {
    //Flujos:
    //1. Flujo normal (OK): solo llega token_ws
    //2. Timeout (más de 10 minutos en el formulario de Transbank): llegan TBK_ID_SESION y TBK_ORDEN_COMPRA
    //3. Pago abortado (con botón anular compra en el formulario de Webpay): llegan TBK_TOKEN, TBK_ID_SESION, TBK_ORDEN_COMPRA
    //4. Caso atipico: llega todos token_ws, TBK_TOKEN, TBK_ID_SESION, TBK_ORDEN_COMPRA
    console.log("================================================================================");
    console.log(request);
    console.log("================================================================================");
    let params = request.method === 'GET' ? request.query : request.body;
  
    let token = params.token_ws;
    let tbkToken = params.TBK_TOKEN;
    let tbkOrdenCompra = params.TBK_ORDEN_COMPRA;
    let tbkIdSesion = params.TBK_ID_SESION;
  
    let step = null;
    let stepDescription = null;
    let viewData = {
      token,
      tbkToken,
      tbkOrdenCompra,
      tbkIdSesion
    };
  
    if (token && !tbkToken) {//Flujo 1
      const commitResponse = await (new WebpayPlus.Transaction()).commit(token);
      viewData = {
        token,
        commitResponse,
      };
      response.render("webpay_commit", {viewData});
      return;
    }
    else if (!token && !tbkToken) {//Flujo 2
      step = "El pago fue anulado por tiempo de espera.";
      stepDescription = "En este paso luego de anulación por tiempo de espera (+10 minutos) no es necesario realizar la confirmación ";
    }
    else if (!token && tbkToken) {//Flujo 3
      step = "El pago fue anulado por el usuario.";
      stepDescription = "En este paso luego de abandonar el formulario no es necesario realizar la confirmación ";
    }
    else if (token && tbkToken) {//Flujo 4
      step = "El pago es inválido.";
      stepDescription = "En este paso luego de abandonar el formulario no es necesario realizar la confirmación ";
    }
  
    response.render("webpay_plus/commit-error", {
      step,
      stepDescription,
      viewData,
    });
  });
//**************************************************************************************************************************
exports.cargarFormReserva = (request, response) =>{
  
    response.render('Crud')

}
//**************************************************************************************************************************
exports.CrearReserva = asyncHandler(async function (request, response) {
  
    const { fecha , motivo, rut } = request.body
    const respuesta = await seq.query(`insert into reserva (fecha_hora, motivo, estado, usuario_rut, cod_tramite) values('${fecha}', '${motivo}', 'Reservada', '${rut}', 1)`, {type: Sequelize.QueryTypes.INSERT});
    response.redirect('/')
})
//**************************************************************************************************************************
exports.ListarReservas = asyncHandler(async function (request, response) {
    const reservas = await seq.query('exec nombreTramite', { type: Sequelize.QueryTypes.SELECT })
    console.log(reservas)
    response.render('historialReservas', {reservas})
})
//**************************************************************************************************************************
exports.EliminarReservas = asyncHandler(async function(request, response) {
    let id = request.params.id
    await seq.query(`DELETE FROM reserva WHERE cod_reserva = ${id}`, { type: Sequelize.QueryTypes.DELETE })
    response.redirect('/historialReservas')
})
//**************************************************************************************************************************
exports.ModificarReservas = asyncHandler(async function (request, response) {
    let id = request.params.id
    const { motivo, fecha } = request.body
    await seq.query(`update reserva set motivo = '${motivo}', fecha_hora = '${fecha}' where cod_reserva = ${id}`, { type: Sequelize.QueryTypes.UPDATE })
    response.redirect('/historialReservas')
})
//**************************************************************************************************************************
exports.FormReserva = asyncHandler(async function (request, response) {
    let id = request.params.id
    const reservas = await seq.query(`select fecha_hora, motivo, cod_reserva from reserva where cod_reserva = ${id}`, { type: Sequelize.QueryTypes.SELECT })
    console.log(reservas)
    response.render('modificarReserva', {reservas} ) 
})

exports.generar_documento = asyncHandler(async function (request, response){
  //const doc_generado = await seq.query('select * from tipo_tramite', { type: Sequelize.QueryTypes.SELECT }) 
  



  response.render('generar_documento')
});

exports.get_documento_pdf = asyncHandler(async function (request, response){

  const doc = new pdf({bufferPage: true});
  const filename =`notaria${Date.now()}.pdf`;
  const stream = response.writeHead(200,{
    'Content-Type':'application/pdf',
    'Content-disposition':`attachment;filename=${filename}`
  });

  doc.on('data',(data)=>{stream.write(data)});
  doc.on('end',()=>{stream.end()});
  doc.text('CARTA PODER SIMPLE',210,70);
  
  doc.moveDown()
  .fillColor('black')
  .fontSize(10)
  .text('NOMBRE DE PERSONAS DESDE FORMULARIO', {
    align: 'center',
    indent: 2,
    height: 2,
    ellipsis: true
  });
  doc.end();


  response.render('documento_pdf')
});
