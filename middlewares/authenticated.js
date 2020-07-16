'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'esta_es_la_clave_secreta_de_la_red_social';

exports.ensureAuth = function (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).send({ message: 'La peticion no tiene header authorization' });
  }
  let token = req.headers.authorization.replace(/['"]+/g, '');

  try {
    var payload = jwt.decode(token, secret);

    if (payload.exp >= moment().unix()) {
      return res.status(401).send({ message: 'El token ha expirado' });
    }
  } catch (error) {
    return res.status(404).send({ message: 'El token no es valido' });
  }

  req.user = payload;

  next();
};