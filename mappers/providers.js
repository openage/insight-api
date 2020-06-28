'use strict'

exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }

    if (entity._bsontype === 'ObjectId') {
        return {
            id: entity.toString()
        }
    }

    return {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        handler: entity.handler,
        config: entity.config,
        timeStamp: entity.timeStamp
    }
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
