'use strict'

exports.toModel = (entity, context) => {
    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        icon: entity.icon,
        description: entity.description,
        isHidden: entity.isHidden,
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
