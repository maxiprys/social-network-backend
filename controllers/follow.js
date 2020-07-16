'use strict'

var Follow = require('../models/follow');

function saveFollow(req, res) {
  let params = req.body;

  let follow = new Follow();
  follow.user = req.user.sub;
  follow.followed = params.followed;

  follow.save((err, followStored) => {
    if (err) return res.status(500).send({ message: 'Error al guardar el seguimiento' });

    if (!followStored) return res.status(404).send({ message: 'No se pudo guardar el seguimiento' });

    return res.status(200).send({ follow: followStored });
  });
}

function deleteFollow(req, res) {
  let userId = req.user.sub;
  let followId = req.params.id;

  Follow.find({ 'user': userId, 'followed': followId }).remove(err => {
    if (err) return res.status(500).send({ message: 'Error al dejar de seguir' });

    return res.status(200).send({ message: 'El follow se ha eliminado' });
  });
}

function getFollowingUsers(req, res) {
  let userId = req.user.sub;
  let page = 1;
  let itemsPerPage = 1;

  if (req.params.id) {
    userId = req.params.id;
  }

  if (req.params.page) {
    page = req.params.page;
  }

  Follow.find({ user: userId }).populate({ path: 'followed' }).limit(itemsPerPage).skip(page-1).exec((err, follows) => {
    if (err) return res.status(500).send({ message: 'Error en el servidor' });

    if (!follows) return res.status(404).send({ message: 'No sigue a ningun usuario' });

    return res.status(200).send({
      page,
      follows
    });
  });
}

function getFollowedUsers(req, res) {
  let userId = req.user.sub;
  let page = 1;
  let itemsPerPage = 1;

  if (req.params.id) {
    userId = req.params.id;
  }

  if (req.params.page) {
    page = req.params.page;
  }

  Follow.find({ followed: userId }).populate('user').limit(itemsPerPage).skip(page-1).exec((err, follows) => {
    if (err) return res.status(500).send({ message: 'Error en el servidor' });

    if (!follows) return res.status(404).send({ message: 'No tiene ningun seguidor' });

    return res.status(200).send({
      page,
      follows
    });
  });
}

module.exports = {
  saveFollow,
  deleteFollow,
  getFollowingUsers,
  getFollowedUsers,
}