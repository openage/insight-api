'use strict'

exports.toModel = (entity, context) => {
    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        timeStamp: entity.timeStamp
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
