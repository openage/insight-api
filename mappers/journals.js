'use strict'

exports.toModel = (entity) => {
    const model = {
        message: entity.message,
        meta: entity.meta,
        type: entity.type,
        changes: [],
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

    if (entity.user && entity.user._doc) {
        model.user = entity.user._doc
    } else {
        model.user = {
            id: entity.user
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

    if (entity.tenant && entity.tenant._doc) {
        model.tenant = {
            id: entity.tenant.id
        }
    } else {
        model.tenant = {
            id: entity.tenant
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
