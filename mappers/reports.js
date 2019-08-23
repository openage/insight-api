'use strict'
const moment = require('moment')

exports.toModel = (entity, context) => {
    let model = {
        id: entity.id,
        count: entity.count,
        status: entity.status,
        date: entity.requestedAt,
        startedAt: entity.startedAt,
        completedAt: entity.completedAt,
        params: [],
        url: entity.fileUrl
    }

    if (entity.params && entity.params.length) {
        entity.params.forEach(item => {
            model.params.push({
                label: item.label,
                key: item.key,
                value: item.value,
                valueKey: item.valueKey,
                valueLabel: item.valueLabel
            })
        })
    }

    let config = entity.type.config || {}

    model.type = {
        id: entity.type.id,
        columns: [],
        params: [],
        config: {
            sheet: config.sheet || 'Data'
        }
    }

    if (entity.type.columns && entity.type.columns.length) {
        entity.type.columns.forEach(item => {
            model.type.columns.push({
                label: item.label,
                key: item.key,
                type: item.type,
                format: item.format
            })
        })
    }

    if (entity.type.params && entity.type.params.length) {
        entity.type.params.forEach(item => {
            model.type.params.push({
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

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
