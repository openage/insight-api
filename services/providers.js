'use strict'
const db = require('../models')

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

    if (model.handler) {
        entity.handler = model.handler
    }

    if (model.config) {
        entity.config = model.config
    }
}

exports.create = async (model, context) => {
    let entity = await this.get(model, context)
    if (!entity) {
        entity = new db.provider({
            organization: context.organization,
            tenant: context.tenant
        })
    }

    await set(model, entity, context)
    await entity.save()
    return entity
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    await set(model, entity, context)
    await entity.save()
    return entity
}

exports.search = async (query, page, context) => {
    let where = {
        organization: context.organization,
        tenant: context.tenant
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

exports.getByCode = async (code, context) => {
    let entity = await db.provider.findOne({
        code: code.toLowerCase(),
        organization: context.organization
    })
    if (entity) {
        return entity
    }
    return db.provider.findOne({
        code: code.toLowerCase(),
        organization: { $exists: false },
        tenant: context.tenant
    })
}

exports.get = async (query, context) => {
    context.logger.silly('services/providers:get')
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.provider.findById(query)
        }
        return this.getByCode(query, context)
    } else if (query.id) {
        return db.provider.findById(query.id)
    } else if (query.code) {
        return this.getByCode(query.code, context)
    }
}
