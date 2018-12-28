'use strict';

const _ = require('underscore');

exports.toModel = (entity) => {

    let model = {
        id: entity.id,
        name: entity.name,
        reportRequest: entity.reportRequest,
        user: entity.user,
        createdAt: entity.createdAt,
        isFavorite: entity.isFavorite
    };
    return model;
};

exports.toSearchModel = entities => {
    return _.map(entities, exports.toModel);
};