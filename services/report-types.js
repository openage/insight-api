'use strict'

const db = require('../models')
const areaService = require('./report-areas')
const masterService = require('./report-masters')

const populate = [{
    path: 'area'
}, {
    path: 'type',
    populate: {
        path: 'provider'
    }
}]

const set = async (model, entity, context) => {
    if (model.code && model.code !== entity.code) {
        if (await this.get(model.code, context)) {
            throw new Error('CODE_ALREADY_EXIST')
        }
        entity.code = model.code.trim().toLowerCase()
    }

    if (model.name) {
        entity.name = model.name
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.icon) {
        entity.icon = model.icon
    }

    if (model.order) {
        entity.order = model.order
    }

    if (model.widget) {
        entity.widget = entity.widget || {}

        entity.widget.class = model.widget.class
        entity.widget.style = model.widget.style
        entity.widget.code = model.widget.code
        entity.widget.title = model.widget.title
        entity.widget.config = model.widget.config
    }

    if (model.container) {
        entity.container = entity.container || {}
        entity.container.style = model.container.style
        entity.container.code = model.container.code
        entity.container.class = model.container.class
    }

    if (model.permissions) {
        entity.permissions = model.permissions
    }

    if (model.area) {
        entity.area = await areaService.get(model.area, context)
    }

    if (model.type) {
        entity.type = await masterService.get(model.type, context)
    }

    if (model.config) {
        entity.config = model.config
    }

    if (model.fields && model.fields.length) {
        entity.fields = model.fields.map(i => {
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
        })
    }

    if (model.filters && model.filters.length) {
        entity.filters = (model.filters || []).map(i => {
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
        })
    }

    if (model.download) {
        entity.download = entity.download || {}

        if (entity.download.excel) {
            const excel = model.download.excel
            entity.download.excel = {
                sheet: excel.sheet,
                headers: excel.headers || [],
                config: excel.config
            }
        }

        if (model.download.csv) {
            const csv = model.download.csv
            entity.download.csv = {
                formatter: csv.formatter,
                headers: csv.headers || [],
                config: csv.config
            }
        }

        if (model.download.pdf) {
            const pdf = model.download.pdf
            entity.download.pdf = {
                formatter: pdf.formatter,
                headers: pdf.headers || [],
                config: pdf.config
            }
        }
    }

    if (model.status) {
        entity.status = model.status
    }

    return entity
}

const create = async (model, context) => {
    const log = context.logger.start('services/report-types:create')

    let entity = await this.get(model, context)
    if (!entity) {
        entity = new db.reportType({
            status: 'active',
            tenant: context.tenant
        })
    }

    await set(model, entity, context)

    await entity.save()

    log.end()

    return entity
}

exports.create = create

exports.update = async (id, model, context) => {
    let entity = await this.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

exports.search = async (query, page, context) => {
    const log = context.logger.start('services/report-types:search')

    let where = {
        // organization: context.organization
        tenant: context.tenant
    }

    let sorting = 'order'
    if (page && page.sort) {
        sorting = page.sort
    }

    let sort = {}

    switch (sorting) {
        case 'order':
            sort.order = -1
            break
        case 'timeStamp':
            sort.timeStamp = -1
            break
        case 'code':
            sort.code = 1
            break
    }

    if (query.area || query.areaCode) {
        let area = await areaService.get(query.area || query.areaCode, context)
        where['area'] = area
    }

    if (query.status) {
        where.status = query.status
    } else {
        where.status = 'active'
    }
    const count = await db.reportType.find(where).count()

    let items
    if (page) {
        items = await db.reportType.find(where).sort(sort).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.reportType.find(where).sort(sort).populate(populate)
    }

    log.end()
    return {
        count: count,
        items: items
    }
}

exports.get = async (query, context) => {
    const log = context.logger.start('services/report-types:get')
    let entity
    let where = {
        // organization: context.organization
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            entity = await db.reportType.findById(query).populate(populate)
        } else {
            where['code'] = query.toLowerCase()
            entity = await db.reportType.findOne(where).populate(populate)
        }
    } else if (query.id) {
        entity = await db.reportType.findById(query.id).populate(populate)
    } else if (query.code) {
        where['code'] = query.code.toLowerCase()
        entity = await db.reportType.findOne(where).populate(populate)
    }
    log.end()
    return entity
}

exports.data = async (id, query, page, context) => {
    const log = context.logger.start('services/report-types:data')
    const reportType = await this.get(id, context)
    const handler = require(`../providers/${reportType.type.provider.handler}`)

    const filters = []
    // populate default value
    reportType.filters.forEach(f => {
        if (query[f.key]) {
            filters.push({
                key: f.key,
                value: query[f.key]
            })
        } else if (f.value) {
            filters.push({
                key: f.key,
                value: f.value
            })
        }
    })

    const builder = handler(reportType, filters, context)

    let count = await builder.count()
    let items = await builder.items(page)
    let stats = await builder.stats()

    log.end()
    return {
        items: items,
        stats: stats,
        total: count
    }
}
