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

    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        icon: entity.icon,

        provider: {
            id: entity.provider.id,
            code: entity.provider.code,
            name: entity.provider.name
        },
        status: entity.status,

        params: [],
        columns: [],

        timeStamp: entity.timeStamp
    }

    if (entity.config) {
        if (typeof entity.config === 'string') {
            model.config = JSON.parse(entity.config)
        } else {
            model.config = entity.config
        }
    }

    if (entity.params && entity.params.length) {
        entity.params.forEach(item => {
            model.params.push({
                key: item.key,
                dbKey: item.dbKey,
                dbCondition: item.dbCondition,
                type: item.type,
                format: item.format,
                value: item.value
            })
        })
    }

    if (entity.columns && entity.columns.length) {
        entity.columns.forEach(item => {
            model.columns.push({
                key: item.key,
                dbKey: item.dbKey,
                type: item.type,
                ascending: item.ascending || true
            })
        })
    }

    return model
}
