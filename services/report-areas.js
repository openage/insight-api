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

    if (model.icon) {
        entity.icon = model.icon
    }

    if (model.isHidden !== undefined) {
        entity.isHidden = model.isHidden
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.permissions && model.permissions.length) {
        entity.permissions = model.permissions
    }
}

exports.create = async (model, context) => {
    var entity = await this.get(model, context)
    if (!entity) {
        entity = new db.reportArea({
            organization: context.organization,
            tenant: context.tenant
        })
    }

    await set(model, entity, context)

    return entity.save()
}

exports.update = async (id, model, context) => {
    let entity = await this.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant
    }

    if (context.organization) {
        where['$or'] = [
            { organization: { $exists: false } },
            { organization: context.organization }
        ]
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

exports.get = async (query, context) => {
    context.logger.silly('services/report-areas:get')
    let where = {
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.reportArea.findById(query)
        }
        where['code'] = query
        return db.reportArea.findOne(where)
    } else if (query.id) {
        return db.reportArea.findById(query.id)
    } else if (query.code) {
        where['code'] = query.code
        return db.reportArea.findOne(where)
    }
}
