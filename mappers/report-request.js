'use strict';
const _ = require('underscore');
const moment = require('moment');
const logger = require('@open-age/logger')('mapper-report-request');

var titleCase = require('title-case');

function convertMinsToHrsMins(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return `${h} hour ${m} min`;
}

exports.toModel = function(entity) {
    //let log = logger.start('toModel');

    //log.debug('entity', { id: entity.id, params: entity.reportParams });

    let model = {
        id: entity.id,
        type: titleCase(entity.type),
        status: entity.status,
        date: entity.requestedAt,
        reportParams: JSON.parse(entity.reportParams),
        url: entity.fileUrl,
        isFavorite: entity.isFavorite

    };

    switch (entity.status) {
        case 'new':
            model.agoTime = convertMinsToHrsMins(moment().diff(entity.requestedAt, 'minutes'));
            break;
        case 'in-progress':
            model.agoTime = convertMinsToHrsMins(moment().diff(entity.startedAt, 'minutes'));
            break;
        case 'ready':
            model.agoTime = convertMinsToHrsMins(moment().diff(entity.completedAt, 'minutes'));
            break;
        case 'errored':
            model.agoTime = convertMinsToHrsMins(moment().diff(entity.completedAt, 'minutes'));
            break;

    }

    // if (entity.reportParams.merchants && entity.reportParams.merchants.length !== 0) {
    //     let merchant;
    //     entity.reportParams.merchants.forEach(element => {
    //         if (merchant)
    //             merchant = merchant + '-' + element;
    //         else
    //             merchant = '-' + element;

    //     });
    //     if (merchant)
    //         model.merchant = merchant;
    // }

    //log.debug('model', model);
    return model;
};


exports.toSearchModel = entities => {
    return _.map(entities, exports.toModel);
};