'use strict'

var express = require('express');
var PublicationController = require('../controllers/publication');

var api = express.Router();
var middleware_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var middleware_upload = multipart({ uploadDir: './uploads/publications' });

api.post('/publication', middleware_auth.ensureAuth, PublicationController.savePublication);
api.get('/publications/:userId?/:page?', middleware_auth.ensureAuth, PublicationController.getPublications);
api.get('/publication/:id', middleware_auth.ensureAuth, PublicationController.getPublication);
api.delete('/publication/:id', middleware_auth.ensureAuth, PublicationController.deletePublication);
api.post('/upload-image-pub/:id', [middleware_auth.ensureAuth, middleware_upload], PublicationController.uploadImage);
api.get('/get-image-pub/:imageFile', middleware_auth.ensureAuth, PublicationController.getImageFile);

module.exports = api;