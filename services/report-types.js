'use strict'

const db = require('../models')
const mapper = require('../mappers/reportColumns')
const areaService = require('./report-areas')
const providesService = require('./providers')

const populate = 'area provider'

const formatResult = (item, report, context) => {
    report.type.columns.forEach(column => {
        if (column.type === 'date') {
            let value = item[column.key]
            if (value) {
                item[column.key] = moment(value).format(column.format || 'DD-MM-YYYY')
            }
        }

        if (column.type === 'time') {
            let value = item[column.key]
            if (value) {
                item[column.key] = moment(value).format(column.format || 'h:mm:ss a')
            }
        }
    })
    return item
}

const create = async (model, context) => {
    const log = context.logger.start('services/report-types:create')

    let area
    if (model.area) {
        area = await areaService.get(model.area, context)
    }

    let provider
    if (model.provider) {
        provider = await providesService.get(model.provider, context)
    }

    var enitity = new db.reportType({
        code: model.code,
        name: model.name,
        descripiton: model.descripiton,
        icon: model.icon,
        view: model.view,
        order: model.order || 1,
        permissions: model.permissions,
        area: area,
        provider: provider,
        params: model.params,
        columns: model.columns,
        config: model.config,
        status: 'active',
        organization: context.organization,
        tenant: context.tenant
    })

    let report = await enitity.save()

    log.end()

    return report
}

exports.create = create

const search = async (query, page, context) => {
    const log = context.logger.start('services/report-types:search')

    let where = {
        // organization: context.organization
        tenant: context.tenant
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
        items = await db.reportType.find(where).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.reportType.find(where).populate(populate)
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
            where['code'] = query
            entity = await db.reportType.findOne(where).populate(populate)
        }
    } else if (query.id) {
        entity = await db.reportType.findById(query.id).populate(populate)
    } else if (query.code) {
        where['code'] = query.code
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
    if (context.user) {
        query.currentRoleCode = context.user.role.code
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

    data = data.map(i =>  mapper.formatResult(i, tempReport, context))

    let stats

    if (provider.footer) {
        stats = await provider.footer(tempReport, context)
        stats =  mapper.formatResult(stats, tempReport, context)
    }

    let pagedItems = {
        items: data,
        stats: stats,
        total: count
    }

    log.end()
    return pagedItems
}
