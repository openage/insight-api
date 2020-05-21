'use strict'

const userMapper = require('./user')

exports.toModel = (entity, context) => {
    const model = {
        message: entity.message,
        meta: entity.meta,
        type: entity.type,
        changes: [],
        user: userMapper.toModel(entity.user, context),
        timeStamp: entity.timeStamp
    }

    model.entity = {
        id: entity.entity.id,
        code: entity.entity.code,
        name: entity.entity.name,
        type: entity.entity.type
    }

    if (entity.entity.organization && entity.entity.organization._doc) {
        model.entity.organization = {
            id: entity.entity.organization.id
        }
    } else {
        model.entity.organization = {
            id: entity.entity.organization
        }
    }

    if (entity.organization && entity.organization._doc) {
        model.organization = {
            id: entity.organization.id
        }
    } else {
        model.organization = {
            id: entity.organization
        }
    }

    if (entity.changes && entity.changes.length) {
        entity.changes.forEach(item => {
            model.changes.push({
                field: item.field,
                value: item.value,
                oldValue: item.oldValue,
                type: item.type
            })
        })
    }

    return model
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
