'use strict';

const mapper = require('../mappers/favorite');
const auth = require('../helpers/auth');
const { updateFields } = require('../helpers/dbquery')

exports.create = (req, res) => {

  db.favorites.build({
    name: req.body.name,
    reportRequestId: req.body.reportReqId,
    userId: req.context.user.id
  }).save().then((favorites) => {
    if (!favorites) {
      return res.failure('failed to create favorite');
    }
    return res.data(mapper.toModel(favorites));
  }).catch(err => {
    return res.failure(err);
  });
}

exports.search = (req, res) => {
  db.favorites.findAll({
    where: {},
    include: [db.user, db.reportRequest]
  })
    .then((favorites) => {
      if (!favorites) {
        return res.failure('no favorites found');
      }
      return res.page(mapper.toSearchModel(favorites))
    })
}

exports.delete = (req, res) => {
  db.favorites.destroy({
    where: {
      reportRequestId:  req.params.id
    }
  }).then((favorites) => {   
    return res.success('favorite removed Successfully');
  }).catch(err => {
    return res.failure(err);
  });
}

exports.get = (req, res) => {
  db.favorites.find({
    where: {
      id: req.params.id
    },
    include: [db.user, db.reportRequest]    
  }).then((favorites) => {
    if (!favorites) {
      return res.failure('failed to create favorite');
    }
    return res.data(mapper.toModel(favorites));
  }).catch(err => {
    return res.failure(err);
  });
}

