'use strict'
const offline = require('@open-age/offline-processor')
const db = require('../models')

const create = async (model, context) => {
    const log = context.logger.start('services/providers:create')
    var enitity = new db.provider({
        code: model.code,
        name: model.name,
        config: model.config
        // organization: context.organization
    })

    let report = await enitity.save()
    return report
}

exports.create = create

const search = async (query, page, context) => {
    const log = context.logger.start('services/providers:search')

    let where = {
        // organization: context.organization
    }

    const count = await db.provider.find(where).count()

    let items
    if (page) {
        items = await db.provider.find(where).skip(page.skip).limit(page.limit)
    } else {
        items = await db.provider.find(where)
    }

    return {
        count: count,
        items: items
    }
}
exports.search = search

exports.get = async (query, context) => {
    const log = context.logger.start('services/providers:get')
    let entity
    let where = {
        // organization: context.organization
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            entity = await db.provider.findById(query)
        }
        where['code'] = query
        entity = await db.provider.findOne(where)
    } else if (query.id) {
        entity = await db.provider.findById(query.id)
    } else if (query.code) {
        where['code'] = query.code
        entity = await db.provider.findOne(where)
    }
    log.end()
    return entity
}
