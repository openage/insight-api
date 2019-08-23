'use strict'
const moment = require('moment')

exports.toModel = (entity, context) => {
    let config = entity.config || {}

    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        icon: entity.icon,
        view: entity.view,

        provider: {
            id: entity.provider.id,
            code: entity.provider.code,
            name: entity.provider.name
        },
        description: entity.description,
        status: entity.status,
        permissions: [],
        params: [],
        columns: [],

        config: {
            sheet: config.sheet || 'Data'
        },
        timeStamp: entity.timeStamp
    }

    if (entity.area) {
        model.area = {
            id: entity.area.id,
            code: entity.area.code,
            name: entity.area.name
        }
    }

    if (entity.permissions && entity.permissions.length) {
        entity.permissions.forEach(item => {
            model.permissions.push(item)
        })
    }

    if (entity.params && entity.params.length) {
        entity.params.forEach(item => {
            model.params.push({
                label: item.label,
                required: item.required,
                message: item.message,
                key: item.key,
                value: item.value,
                valueKey: item.valueKey,
                valueLabel: item.valueLabel
            })
        })
    }

    if (entity.columns && entity.columns.length) {
        entity.columns.forEach(item => {
            model.columns.push({
                label: item.label,
                key: item.key,
                type: item.type,
                format: item.format,
                style: item.style,
                icon: item.icon
            })
        })
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
