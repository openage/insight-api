'use strict'

exports.toModel = function (entity) {
    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        timeStamp: entity.timeStamp
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
