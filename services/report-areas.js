'use strict'
const db = require('../models')

const create = async (model, context) => {
    const log = context.logger.start('services/providers:create')
    var enitity = new db.reportArea({
        code: model.code,
        name: model.name,
        icon: model.icon,
        permissions: model.permissions

    })

    return enitity.save()
}

exports.create = create

const search = async (query, page, context) => {
    const log = context.logger.start('services/report-areas:search')

    let where = {
        // organization: context.organization
    }

    const count = await db.reportArea.find(where).count()

    let items
    if (page) {
        items = await db.reportArea.find(where).skip(page.skip).limit(page.limit)
    } else {
        items = await db.reportArea.find(where)
    }

    return {
        count: count,
        items: items
    }
}
exports.search = search

exports.get = async (query, context) => {
    const log = context.logger.start('services/report-areas:get')
    let entity
    let where = {
        // organization: context.organization
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            entity = await db.reportArea.findById(query)
        }
        where['code'] = query
        entity = await db.reportArea.findOne(where)
    } else if (query.id) {
        entity = await db.reportArea.findById(query.id)
    } else if (query.code) {
        where['code'] = query.code
        entity = await db.reportArea.findOne(where)
    }
    log.end()
    return entity
}
