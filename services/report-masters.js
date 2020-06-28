'use strict'

const db = require('../models')
const providesService = require('./providers')
const populate = 'provider'

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

    if (model.provider) {
        entity.provider = await providesService.get(model.provider, context)
    }

    if (model.config) {
        // the property names may start with '$' and cannot be saved in the db
        if (typeof model.config === 'string') {
            entity.config = model.config
        } else {
            entity.config = JSON.stringify(model.config)
        }
    }

    if (model.columns && model.columns.length) {
        entity.columns = model.columns.map(c => {
            return {
                key: c.key,
                dbKey: c.dbKey,
                type: c.type,
                ascending: c.ascending || true
            }
        })
    }

    if (model.params && model.params.length) {
        entity.params = model.params.map(c => {
            return {
                key: c.key,
                dbKey: c.dbKey,
                dbCondition: c.dbCondition,
                type: c.type,
                format: c.format,
                regex: c.regex,
                value: c.value
            }
        })
    }

    if (model.status) {
        entity.status = model.status
    }

    return entity
}

exports.create = async (model, context) => {
    const log = context.logger.start('services/report-masters:create')

    let entity = await this.get(model, context)
    if (!entity) {
        entity = new db.reportMaster({
            status: 'active',
            tenant: context.tenant
        })
    }
    await set(model, entity, context)
    await entity.save()

    log.end()

    return entity
}

exports.update = async (id, model, context) => {
    let entity = await this.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

const search = async (query, page, context) => {
    const log = context.logger.start('services/report-masters:search')

    let where = {
        tenant: context.tenant
    }

    let sorting = 'order'
    if (page && page.sort) {
        sorting = page.sort
    }

    let sort = {}

    switch (sorting) {
        case 'timeStamp':
            sort.timeStamp = -1
            break
        case 'code':
            sort.code = 1
            break
    }

    if (query.status) {
        where.status = query.status
    } else {
        where.status = 'active'
    }
    const count = await db.reportMaster.find(where).count()

    let items
    if (page) {
        items = await db.reportMaster.find(where).sort(sort).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.reportMaster.find(where).sort(sort).populate(populate)
    }

    log.end()
    return {
        count: count,
        items: items
    }
}
exports.search = search

exports.get = async (query, context) => {
    const log = context.logger.start('services/report-masters:get')
    let entity
    let where = {
        // organization: context.organization
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            entity = await db.reportMaster.findById(query).populate(populate)
        } else {
            where['code'] = query.toLowerCase()
            entity = await db.reportMaster.findOne(where).populate(populate)
        }
    } else if (query.id) {
        entity = await db.reportMaster.findById(query.id).populate(populate)
    } else if (query.code) {
        where['code'] = query.code.toLowerCase()
        entity = await db.reportMaster.findOne(where).populate(populate)
    }
    log.end()
    return entity
}
