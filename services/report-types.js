'use strict'

const db = require('../models')
const mapper = require('../mappers/reportColumns')
const areaService = require('./report-areas')
const providesService = require('./providers')

const datesHelper = require('../helpers/dates')

const populate = 'area provider'

const formatResult = (item, report, context) => {
    report.type.columns.forEach(column => {
        if (column.type === 'date') {
            let value = item[column.key]
            if (value) {
                item[column.key] = datesHelper.date(value).toString(column.format)
            }
        }

        if (column.type === 'time') {
            let value = item[column.key]
            if (value) {
                item[column.key] = datesHelper.time(value).toString(column.format)
            }
        }
    })
    return item
}

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.icon) {
        entity.icon = model.icon
    }

    if (model.widget) {
        entity.widget = entity.widget || {}

        entity.widget.class = model.widget.class
        entity.widget.style = model.widget.style
        entity.widget.code = model.widget.code
        entity.widget.title = model.widget.title
        entity.widget.xAxisLabel = model.widget.xAxisLabel
        entity.widget.yAxisLabel = model.widget.yAxisLabel
    }

    if (model.container) {
        entity.container = entity.container || {}
        entity.container.style = model.container.style
        entity.container.code = model.container.code
        entity.container.class = model.container.class
    }

    if (model.view) {
        entity.view = model.view
        entity.widget = entity.widget || {}
        entity.widget.code = model.view
    }

    if (model.order) {
        entity.order = model.order
    }

    if (model.permissions) {
        entity.permissions = model.permissions
    }

    if (model.area) {
        entity.area = await areaService.get(model.area, context)
    }

    if (model.provider) {
        entity.provider = await providesService.get(model.provider, context)
    }

    if (model.config) {
        entity.config = model.config
    }

    if (model.columns && model.columns.length) {
        entity.columns = model.columns.map(c => {
            return {
                label: c.label,
                key: c.key,
                dbKey: c.dbKey,
                type: c.type,
                format: c.format,
                ascending: c.ascending || true,
                style: c.style,
                icon: c.icon,
                isEmit: c.isEmit
            }
        })
    }

    if (model.params && model.params.length) {
        entity.params = model.params.map(c => {
            return {
                label: c.label,
                key: c.key,
                control: c.control,
                options: (c.options || []).map(o => {
                    return {
                        label: o.label,
                        value: o.value
                    }
                }),
                style: c.style,
                required: c.required,
                message: c.message,
                autoFill: c.autoFill,

                dbKey: c.dbKey,
                dbCondition: c.dbCondition,
                type: c.type,
                format: c.format,
                isOr: c.isOr,
                regex: c.regex,

                value: c.value,
                valueKey: c.valueKey,
                valueLabel: c.valueLabel
            }
        })
    }

    if (model.status) {
        entity.status = model.status
    }

    return entity
}

const create = async (model, context) => {
    const log = context.logger.start('services/report-types:create')

    var entity = new db.reportType({
        code: model.code,
        order: 1,
        status: 'active',
        // organization: context.organization,
        tenant: context.tenant
    })

    let report = await entity.save()

    log.end()

    return report
}

exports.create = create

exports.update = async (id, model, context) => {
    let entity = await this.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

const search = async (query, page, context) => {
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
exports.search = search

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
    const reportType = await exports.get(id, context)
    const provider = require(`../providers/${reportType.provider.handler}`)

    let tempReport = {
        type: reportType,
        params: []
    }
    if (context.organization) {
        query.currentOrganizationCode = context.organization.code
    }
    if (context.organization) {
        query.currentOrganizationId = context.organization.id
    }
    if (context.user) {
        query.currentRoleCode = context.user.role.code
        query.currentSupervisor = context.user.role.code
    }
    reportType.params.forEach(param => {
        if (query[param.key]) {
            let input = {
                key: param.key,
                value: {}
            }

            if (param.valueKey) {
                input.value[param.valueKey] = query[param.key]
            } else {
                input.value = query[param.key]
            }
            tempReport.params.push(input)
        }
    })

    let count = await provider.count(tempReport, context)
    page = page || {}
    let data = await provider.fetch(tempReport, page.skip, page.limit, context)

    data = data.map(i => mapper.formatResult(i, tempReport, context))

    let stats

    if (provider.footer) {
        stats = await provider.footer(tempReport, context)
        stats = mapper.formatResult(stats, tempReport, context)
    }

    let pagedItems = {
        items: data,
        stats: stats,
        total: count
    }

    log.end()
    return pagedItems
}
