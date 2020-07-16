'use strict'

var express = require('express');
var UserController = require('../controllers/user');

var api = express.Router();
var middleware_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var middleware_upload = multipart({ uploadDir: './uploads/users' });

api.get('/user/:id', middleware_auth.ensureAuth, UserController.getUser);
api.get('/users', middleware_auth.ensureAuth, UserController.getUsers);
api.get('/counters/:id?', middleware_auth.ensureAuth, UserController.getCounters);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.post('/upload-image-user/:id', [middleware_auth.ensureAuth, middleware_upload], UserController.uploadImage);
api.get('/get-image-user/:imageFile', middleware_auth.ensureAuth, UserController.getImageFile);

module.exports = api;