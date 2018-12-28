'use strict';

const _ = require('underscore');

exports.toModel = (entity) =>{

  let model = {
    id: entity.id,
    firstname: entity.firstname,
    lastname: entity.lastname,
    emailId: entity.emailId,
    mobile: entity.mobile,
    role: entity.role,
    permission:  JSON.parse(entity.permission),
    token: entity.token,
    createdAt: entity.createdAt
  }
  return model;
};

exports.toSearchModel = entities => {
  return _.map(entities, exports.toModel);
};