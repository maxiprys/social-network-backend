'use strict'

var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');

function getUser(req, res) {
  let userId = req.user.sub;

  User.findById(userId, (err, user) => {
    if (err) return res.status(500).send({ message: 'Error al consultar usuario' });

    if (!user) return res.status(404).send({ message: 'No existe el usuario' });

    userFollow(req.user.sub, userId).then((value) => {
      user.password = undefined;
      return res.status(200).send({
        user,
        following: value.following,
        followed: value.followed
      });
    });
  });
}

function getUsers(req, res) {
  let userId = req.user.sub;

  User.find({_id: { $ne: userId }}, (err, users) => {
    if (err) return res.status(500).send({ message: 'Error al consultar usuarios' });

    if (!users) return res.status(404).send({ message: 'No hay usuarios' });

    // userFollow(req.user.sub, userId).then((value) => {
    //   user.password = undefined;
      return res.status(200).send({
        users,
        // following: value.following,
        // followed: value.followed
      });
    // });
  });
}

async function userFollow(identity_user_id, user_id) {
  let following, followed;

  try {
    following = await Follow.exists({ "user": identity_user_id, "followed": user_id });
    followed = await Follow.exists({ "user": user_id, "followed": identity_user_id });
  } catch (err) {
    return handleError(err);
  }

  return {
    following: following,
    followed: followed
  }
}

function getCounters(req, res) {
  let userId = req.user.sub;

  if (req.params.id) {
    userId = req.params.id;
  }

  getCountFollow(userId).then((value) => {
    return res.status(200).send({
      following: value.following,
      followed: value.followed,
      publications: publications
    });
  })
}

async function getCountFollow(user_id) {
  let following, followed, publications;

  try {
    following = await Follow.count({ "user": user_id });
    followed = await Follow.count({ "followed": user_id });
    publications = await Publication.count({ "user": user_id });
  } catch (error) {
    return handleError(err);
  }

  return {
    following: following,
    followed: followed,
    publications: publications
  }
}

function saveUser(req, res) {
  let params = req.body;
  let user = new User();

  if (params.name && params.surname /*&& params.nick */&& params.email && params.password) {
    user.name = params.name;
    user.surname = params.surname;
    // user.nick = params.nick;
    user.email = params.email;
    user.role = 'ROLE_USER';
    user.image = null;

    //Controlar usuario duplicado
    User.find({ email: user.email.toLowerCase() }).exec((err, users) => {
      if (err) return res.status(500).send({ message: 'Error al buscar usuarios duplicados' });

      if (users && users.length > 0) {
        return res.status(200).send({ message: 'Ya hay un usuario creado con el mismo email' });
      } else {

        //Encripta la password y guarda usuario
        bcrypt.hash(params.password, null, null, (err, hash) => {
          user.password = hash;

          user.save((err, userSaved) => {
            if (err) return res.status(500).send({ message: 'Error al guardar el usuario' });

            if (userSaved) {
              res.status(200).send({ user: userSaved });
            } else {
              res.status(404).send({ message: 'No se ha registrado el usuario' });
            }
          });
        });
      }
    });

  } else {
    res.status(404).send({
      message: 'Envia todos los campos necesarios'
    });
  }
}

function loginUser(req, res) {
  let params = req.body;

  let email = params.email;
  let password = params.password;

  User.findOne({ email: email }, (err, user) => {
    if (err) return res.status(500).send({ message: 'Error al intentar loguearse' });

    if (user) {
      bcrypt.compare(password, user.password, (err, valid) => {
        if (valid) {
          user.password = undefined;
          if (params.gettoken) {
            //generar y devolver token
            return res.status(200).send({
              user,
              token: jwt.createdToken(user)
            });
          } else {
            return res.status(200).send({ user });
          }
        } else {
          return res.status(404).send({ message: 'La contraseña es incorrecta' });
        }
      });
    } else {
      return res.status(404).send({ message: 'No hay usuario registrado con ese email' });
    }
  })
}

function uploadImage(req, res) {
  let userId = req.params.id;

  if (req.files) {
    let file_path = req.files.image.path;
    let file_split = file_path.split('/');
    let file_name = file_split[2];
    let ext_split = file_name.split('.');
    let file_ext = ext_split[1];

    if (userId != req.user.sub) {
      return deleteFile(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
    }

    if (file_ext === 'png' || file_ext === 'jpg' || file_ext === 'jpeg') {

      User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, userUpdated) => {
        if (err) return res.status(500).send({ message: 'Error en la llamada' });

        if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar la imagen del usuario' });

        return res.status(200).send({ user: userUpdated });
      });

    } else {
      return deleteFile(res, file_path, 'La extension de la imagen no es válida');
    }

  } else {
    return res.status(200).send({ message: 'No se han subido archivos' });
  }
}

function deleteFile(res, file_path, message) {
  fs.unlink(file_path, (err) => {
    return res.status(200).send({ message: message });
  });
}

function getImageFile(req, res) {
  let image_file = req.params.imageFile;
  let path_file = `./uploads/users/${image_file}`;

  fs.exists(path_file, (exists) => {
    if (exists) {
      res.sendFile(path.resolve(path_file));
    } else {
      res.status(200).send({ message: 'No existe la imagen' });
    }
  })
}

module.exports = {
  getUser,
  getUsers,
  getCounters,
  saveUser,
  loginUser,
  uploadImage,
  getImageFile,
}