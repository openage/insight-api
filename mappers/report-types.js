'use strict'

const masterMapper = require('./report-masters')

exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }

    if (entity._bsontype === 'ObjectId') {
        return {
            id: entity.toString()
        }
    }

    let widget = entity.widget || {}
    let container = entity.container || {}

    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        icon: entity.icon,
        description: entity.description,
        area: {
            id: entity.area.id,
            code: entity.area.code,
            name: entity.area.name
        },
        order: entity.order,
        widget: {
            code: widget.code || entity.view,
            title: widget.title || entity.name,
            style: widget.style || {},
            class: widget.class,
            config: widget.config || {}
        },
        container: {
            code: container.code,
            style: container.style || {},
            class: container.class
        },
        status: entity.status,
        permissions: entity.permissions || [],
        filters: (entity.filters || []).map(i => {
            return {
                label: i.label,
                key: i.key,
                control: i.control,
                config: i.config || {},
                style: i.style || {},
                type: i.type,
                format: i.format,
                value: i.value,
                valueKey: i.valueKey,
                valueLabel: i.valueLabel
            }
        }),
        fields: (entity.fields || []).map(i => {
            return {
                label: i.label,
                icon: i.icon,
                description: i.description,
                key: i.key,
                formula: i.formula,
                type: i.type,
                format: i.format,
                ascending: i.ascending || true,
                style: i.style || {},
                config: i.config || {}
            }
        }),

        config: entity.config || {},
        timeStamp: entity.timeStamp
    }

    const designer = true

    if (designer) {
        model.type = masterMapper.toModel(entity.type, context)

        if (entity.download) {
            model.download = {}

            if (entity.download.excel) {
                const excel = entity.download.excel
                model.download.excel = {
                    sheet: excel.sheet,
                    headers: excel.headers || [],
                    config: excel.config
                }
            }

            if (entity.download.csv) {
                const csv = entity.download.csv
                model.download.csv = {
                    headers: csv.headers || [],
                    config: csv.config
                }
            }

            if (entity.download.pdf) {
                const pdf = entity.download.pdf
                model.download.pdf = {
                    headers: pdf.headers || [],
                    config: pdf.config
                }
            }
        }
    }

    return model
}
