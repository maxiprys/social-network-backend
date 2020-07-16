'use strict'

var express = require('express');
var MessageController = require('../controllers/message');

var api = express.Router();
var middleware_auth = require('../middlewares/authenticated');

api.post('/message', middleware_auth.ensureAuth, MessageController.saveMessage);
api.get('/my-messages/:page?', middleware_auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/messages/:page?', middleware_auth.ensureAuth, MessageController.getEmitMessages);
api.get('/unviewed-messages', middleware_auth.ensureAuth, MessageController.getUnviewedMessages);
api.get('/set-viewed-messages', middleware_auth.ensureAuth, MessageController.setViewedMessages);

module.exports = api;