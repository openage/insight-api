'use strict'
const offline = require('@open-age/offline-processor')
const db = require('../models')
const reportTypes = require('./report-types')

const populate = {
    path: 'type',
    populate: {
        path: 'provider area user'
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
        organization: context.organization
    })

    let report = await entity.save()
    return report
}

exports.update = async (id, model, context) => {
    const report = await exports.get(id, context)

    if (model.params) {
        report.params = model.params
    }

    let generate = false
    if (model.status) {
        if (model.status !== report.status && model.status === 'new') {
            generate = true
        }
        report.status = model.status
    }

    await report.save()

    if (generate) {
        await offline.queue('report', 'create', report, context)
    }

    return report
}

exports.data = async (id, page, context) => {
    const report = await exports.get(id, context)
    const provider = require(`../providers/${report.type.provider.handler}`)
    let count = await provider.count(report, context)
    page = page || {}
    let data = await provider.fetch(report, page.skip, page.limit, context)

    let pagedItems = {
        items: data,
        total: count
    }

    return pagedItems
}

exports.search = async (query, page, context) => {
    const log = context.logger.start('services/reports:search')

    let where = {
        organization: context.organization
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

    return {
        count: count,
        items: items
    }
}

exports.get = async (query, context) => {
    let log = context.logger.start('services/reports:get')
    if (typeof query === 'string' && query.isObjectId()) {
        return db.report.findById(query).populate(populate)
    } else if (query.id) {
        return db.report.findById(query.id).populate(populate)
    }
    return null
}
