'use strict'
const db = require('../models')

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.shortName) {
        entity.shortName = model.shortName
    }

    if (model.logo) {
        entity.logo = {
            url: model.logo.url,
            thumbnail: model.logo.thumbnail
        }
    }

    if (model.config) {
        entity.config = model.config
    }
    if (model.status) {
        entity.status = model.status
    }
}

exports.create = async (model, context) => {
    let organization = new db.organization({
        code: model.code.toLowerCase(),
        status: 'active',
        tenant: context.tenant
    })
    await set(model, organization, context)
    await organization.save()
    return organization
}

exports.update = async (id, model, context) => {
    if (id === 'me') {
        id = context.organization.id
    }

    let organization = await db.organization.findById(id).populate('owner')
    await set(model, organization, context)
    return organization.save()
}

exports.get = async (query, context) => {
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.organization.findById(query).populate('owner')
        } else {
            if (query === 'me') {
                return db.organization.findById(context.organization.id).populate('tenant')
            }
            return db.organization.findOne({ code: query.toLowerCase(), tenant: context.tenant }).populate('tenant')
        }
    }

    if (query.id) {
        if (query.id === 'me') {
            return db.organization.findById(context.organization.id).populate('owner')
        }
        return db.organization.findById(query.id).populate('owner')
    }

    if (query.code) {
        return db.organization.findOne({ code: query.code.toLowerCase(), tenant: context.tenant }).populate('owner')
    }

    return null
}

exports.getByCode = async (code, context) => {
    return db.organization.findOne({
        code: code.toLowerCase(),
        tenant: context.tenant
    })
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant
    }
    if (!page || !page.limit) {
        return {
            items: await db.organization.find(where)
        }
    }
    return {
        items: await db.organization.find(where).limit(page.limit).skip(page.skip),
        count: await db.organization.count(where)
    }
}
