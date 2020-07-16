'use strict'

var fs = require('fs');
var path = require('path');
var moment = require('moment');

var Publication = require('../models/publication');
var Follow = require('../models/follow');

function savePublication(req, res) {
  let params = req.body;

  if (!params.text) return res.status(200).send({ message: 'Debes enviar un texto' });

  let publication = new Publication();
  publication.text = params.text;
  publication.file = null;
  publication.user = req.user.sub;
  publication.created_at = moment().unix();

  publication.save((err, publicationSaved) => {
    if (err) return res.status(500).send({ message: 'Error al guardar la publicacion' });

    if (!publicationSaved) return res.status(404).send({ message: 'La publicacion no ha sido guardada' });

    return res.status(200).send({ publication: publicationSaved });
  });
}

function getPublications(req, res) {
  let page = 1;
  let itemsPerPage = 4;
  let userId = req.params.userId;

  if (req.params.page) {
    page = req.params.page;
  }

  if (!userId) {
    Follow.find({ user: req.user.sub }).populate('followed').exec((err, follows) => {
      if (err) return res.status(500).send({ message: 'Error al obtener publicaciones' });

      let follows_clean = [];

      follows_clean.push(req.user.sub);

      follows.forEach((follow) => {
        follows_clean.push(follow.followed);
      });

      Publication.find({ user: { "$in": follows_clean } }).sort('-created_at').populate('user').limit(itemsPerPage).skip(page - 1).exec((err, publications) => {
        if (err) return res.status(500).send({ message: 'Error al obtener publicaciones' });

        if (!publications) return res.status(500).send({ message: 'No hay publicaciones' });

        return res.status(200).send({
          page,
          publications
        });
      });
    });
  } else {

    Publication.find({ user: userId }).sort('-created_at').populate('user').limit(itemsPerPage).skip(page - 1).exec((err, publications) => {
      if (err) return res.status(500).send({ message: 'Error al obtener publicaciones' });

      if (!publications) return res.status(500).send({ message: 'No hay publicaciones' });

      return res.status(200).send({
        page,
        publications
      });
    });
  }
}

function getPublication(req, res) {
  let publicationId = req.params.id;

  Publication.findById(publicationId, (err, publication) => {
    if (err) return res.status(500).send({ message: 'Error al obtener publicacion' });

    if (!publication) return res.status(500).send({ message: 'No existe la publicacion' });

    return res.status(200).send({ publication });
  });
}

function deletePublication(req, res) {
  let publicationId = req.params.id;

  Publication.findOneAndRemove({ 'user': req.user.sub, '_id': publicationId }, (err, publication) => {
    if (err) return res.status(500).send({ message: 'Error al buscar publicacion' });

    if (!publication) return res.status(500).send({ message: 'No se encontró la publicacion' });

    return deleteFile(res, publication.file, 'Publicacion eliminada correctamente');
  });
}

function uploadImage(req, res) {
  let publicationId = req.params.id;

  if (req.files) {
    let file_path = req.files.image.path;
    let file_split = file_path.split('/');
    let file_name = file_split[2];
    let ext_split = file_name.split('.');
    let file_ext = ext_split[1];

    if (file_ext === 'png' || file_ext === 'jpg' || file_ext === 'jpeg') {
      Publication.findOne({ 'user': req.user.sub, '_id': publicationId }).exec((err, publication) => {
        if (publication) {
          Publication.findByIdAndUpdate(publicationId, { file: file_name }, { new: true }, (err, publicationUpdated) => {
            if (err) return res.status(500).send({ message: 'Error en la llamada' });

            if (!publicationUpdated) return res.status(404).send({ message: 'No se ha podido actualizar la imagen de la publicacion' });

            return res.status(200).send({ publication: publicationUpdated });
          });
        } else {
          return deleteFile(res, file_path, 'No tienes permisos para actualizar esta publicacion');
        }
      })

    } else {
      return deleteFile(res, file_path, 'La extension de la imagen no es válida');
    }

  } else {
    return res.status(200).send({ message: 'No se han subido archivos' });
  }
}

function deleteFile(res, file_path, message) {
  fs.unlink(`./uploads/publications/${file_path}`, (err) => {
    if(err) return res.status(500).send({ message: 'Error al eliminar la imagen' });

    return res.status(200).send({ message: message });
  });
}

function getImageFile(req, res) {
  let image_file = req.params.imageFile;
  let path_file = `./uploads/publications/${image_file}`;

  fs.exists(path_file, (exists) => {
    if (exists) {
      res.sendFile(path.resolve(path_file));
    } else {
      res.status(200).send({ message: 'No existe la imagen' });
    }
  })
}

module.exports = {
  savePublication,
  getPublications,
  getPublication,
  deletePublication,
  uploadImage,
  getImageFile,
}