'use strict'
const offline = require('@open-age/offline-processor')
const db = require('../models')
const reportTypes = require('./report-types')
const mapper = require('../mappers/reportColumns')

const populate = {
    path: 'type',
    populate: {
        path: 'provider area user'
    }
}

const set = async (model, entity, context) => {
    if (model.params) {
        entity.params = model.params
    }

    let generate = false
    if (model.status) {
        if (model.status !== entity.status && model.status === 'new') {
            generate = true
        }
        entity.status = model.status
    }

    if (generate) {
        await offline.queue('report', 'create', entity, context)
    }
}

exports.create = async (model, context) => {
    const log = context.logger.start('services/reports:create')

    const type = await reportTypes.get(model.type, context)

    var entity = new db.report({
        type: type,
        requestedAt: new Date(),
        params: model.params,
        status: 'draft',
        user: context.user,
        organization: context.organization,
        tenant: context.tenant
    })

    let report = await entity.save()
    return report
}

exports.update = async (id, model, context) => {
    const report = await exports.get(id, context)
    await set(model, report, context)
    await report.save()
    return report
}

exports.data = async (id, page, context) => {
    const log = context.logger.start('services/reports:data')
    const report = await exports.get(id, context)
    const provider = require(`../providers/${report.type.provider.handler}`)
    let count = await provider.count(report, context)
    page = page || {}
    let data = await provider.fetch(report, page.skip, page.limit, context)

    data = data.map(i => mapper.formatResult(i, report, context))

    let stats

    if (provider.footer) {
        stats = await provider.footer(report, context)
        stats = mapper.formatResult(stats, report, context)
    }

    let pagedItems = {
        items: data,
        stats: stats,
        total: count
    }

    log.end()
    return pagedItems
}

exports.search = async (query, page, context) => {
    const log = context.logger.start('services/reports:search')

    let where = {
        organization: context.organization,
        tenant: context.tenant
    }
    if (query.type) {
        where.type = query.type
    }

    if (query.typeId) {
        where.type = await reportTypes.get(query.typeId, context)
    }

    if (query.status) {
        where.status = query.status
    } else {
        where.status = {
            $in: ['new', 'in-progress', 'ready']
        }
    }

    const count = await db.report.find(where).count()

    let items
    if (page) {
        items = await db.report.find(where).populate(populate).sort({ requestedAt: -1 }).skip(page.skip).limit(page.limit)
    } else {
        items = await db.report.find(where).populate(populate).sort({ requestedAt: -1 })
    }

    log.end()

    return {
        count: count,
        items: items
    }
}

exports.get = async (query, context) => {
    context.logger.silly('services/reports:get')
    if (typeof query === 'string' && query.isObjectId()) {
        return db.report.findById(query).populate(populate)
    } else if (query.id) {
        return db.report.findById(query.id).populate(populate)
    }
}
