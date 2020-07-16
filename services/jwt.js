'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'esta_es_la_clave_secreta_de_la_red_social';

exports.createdToken = function (user) {
  let payload = {
    sub: user.id,
    name: user.name,
    surname: user.surname,
    nick: user.nick,
    email: user.email,
    role: user.role,
    image: user.image,
    iat: moment().unix(),
    exp: moment().add(30, 'days').unix
  };

  return jwt.encode(payload, secret);
};