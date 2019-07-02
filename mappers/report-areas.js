'use strict'
const moment = require('moment')

exports.toModel = function (entity) {
    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        icon: entity.icon,
        permissions: [],
        timeStamp: entity.timeStamp
    }

    if (entity.permissions && entity.permissions.length) {
        entity.permissions.forEach(item => {
            model.permissions.push(item)
        })
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
