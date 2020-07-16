'use strict'

const moment = require('moment');

const Message = require('../models/message');

function saveMessage(req, res) {
  let params = req.body;

  if (!params.text || !params.receiver) return res.status(200).send({ message: 'Faltan campos necesarios' });

  let message = new Message();
  message.emitter = req.user.sub;
  message.receiver = params.receiver;
  message.text = params.text;
  message.created_at = moment().unix();
  message.viewed = 'false';

  message.save((err, messageSaved) => {
    if (err) return res.status(500).send({ message: 'Error en guardado de mensajes' });

    if (!messageSaved) return res.status(200).send({ message: 'No se pudo guardar el mensaje' });

    return res.status(200).send({ message: messageSaved });
  });
}

function getReceivedMessages(req, res) {
  let userId = req.user.sub;
  let page = 1;
  let itemsPerPage = 4;

  if(req.params.page) {
    page = req.params.page;
  }

  Message.find({receiver: userId}).populate('emitter', '_id name surname image nick').limit(itemsPerPage).skip(page-1).exec((err, messages) => {
    if (err) return res.status(500).send({ message: 'Error al consultar mensajes' });

    if (!messages) return res.status(404).send({ message: 'No hay ningun mensaje' });

    return res.status(200).send({
      page,
      messages
    });
  });
}

function getEmitMessages(req, res) {
  let userId = req.user.sub;
  let page = 1;
  let itemsPerPage = 4;

  if(req.params.page) {
    page = req.params.page;
  }

  Message.find({emitter: userId}).populate('emitter receiver', '_id name surname image nick').limit(itemsPerPage).skip(page-1).exec((err, messages) => {
    if (err) return res.status(500).send({ message: 'Error al consultar mensajes' });

    if (!messages) return res.status(404).send({ message: 'No hay ningun mensaje' });

    return res.status(200).send({
      page,
      messages
    });
  });
}

function getUnviewedMessages(req, res) {
  let userId = req.user.sub;

  Message.count({receiver: userId, viewed: 'false'}).exec((err, count) => {
    if (err) return res.status(500).send({ message: 'Error al consultar mensajes' });

    return res.status(200).send({
      'unviewed': count
    });
  })
}

function setViewedMessages(req, res) {
  let userId = req.user.sub;

  Message.update({receiver: userId, viewed: 'false'}, {viewed: 'true'}, {"multi": true}).exec((err, messagesUpdated) => {
    if (err) return res.status(500).send({ message: 'Error en la peticion' });

    return res.status(200).send({
      messages: messagesUpdated
    });
  })
}

module.exports = {
  saveMessage,
  getReceivedMessages,
  getEmitMessages,
  getUnviewedMessages,
  setViewedMessages,
}