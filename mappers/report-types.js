'use strict'
const moment = require('moment')

exports.toModel = (entity, context) => {
    let config = entity.config || {}
    config.download = config.download || {}

    let widget = entity.widget || {}
    let container = entity.container || {}

    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        icon: entity.icon,
        order: entity.order,
        view: entity.view,
        graph: entity.graph,
        widget: {
            code: widget.code || entity.view,
            title: widget.title || entity.name,
            style: widget.style || {},
            class: widget.class,
            xAxisLabel: widget.xAxisLabel,
            yAxisLabel: widget.yAxisLabel,
        },
        container: {
            code: container.code,
            style: container.style || {},
            class: container.class
        },
        autoSearch: entity.autoSearch,

        provider: {
            id: entity.provider.id,
            code: entity.provider.code,
            name: entity.provider.name
        },
        status: entity.status,
        permissions: [],
        params: [],
        columns: [],

        config: {
            summary: config.summary,
            download: {
                csv: config.download.csv || {},
                excel: config.download.excel || {
                    sheet: config.sheet || 'Data'
                },
                pdf: config.download.pdf || {}
            },
            click: config.click || {},
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
                key: item.key,
                control: item.control,
                options: (item.options || []).map(o => {
                    return {
                        label: o.label,
                        value: o.value
                    }
                }),
                style: item.style || {},
                required: item.required,
                message: item.message,
                autoFill: item.autoFill,

                dbKey: item.dbKey,
                dbCondition: item.dbCondition,
                type: item.type,
                format: item.format,
                isOr: item.isOr,
                regex: item.regex,

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
                ascending: item.ascending || true,
                style: item.style || {},
                icon: item.icon,
                isEmit: item.isEmit
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
