'use strict'

const db = require('../models')
const userService = require('./users')

const set = async (obj, model, context) => {
    if (model.message) {
        obj.message = model.message
    } else {
        obj.message = ''
    }
    if (model.entity && model.entity.id && model.entity.type) {
        obj.entity = {
            id: model.entity.id || '',
            code: model.entity.code || '',
            type: model.entity.type || '',
            name: model.entity.name || ''
        }
        if (model.entity.organization) {
            obj.entity.organization = model.entity.organization
        } else {
            obj.entity.organization = context.organization
        }
    } else {
        // obj.entity = {
        //     id: '',
        //     code: '',
        //     type: '',
        //     name: '',
        //     organization = context.organization
        // }
        obj.entity = {}
    }
    if (model.meta) {
        obj.meta = model.meta
    } else {
        obj.meta = ''
    }
    if (model.type) {
        obj.type = model.type
    } else {
        obj.type = ''
    }
    obj.changes = model.changes || []

    return obj
}

const create = async (model, context) => {
    const log = context.logger.start('services/journal:create')

    var entity = new db.journal({
        user: context.user,
        organization: context.organization,
        tenant: context.tenant
    })

    await set(entity, model, context)

    let object = await entity.save().catch(err => {
        context.logger.warn(err)
    })

    return object
}

exports.create = create

const search = async (query, page, context) => {
    const log = context.logger.start('services/journals:search')

    if (query.entity_id) {
        query.entity = query.entity || {}

        query.entity.id = query.entity_id
    }

    if (query.entity_type) {
        query.entity = query.entity || {}
        query.entity.id = query.entity_type
    }

    let where

    if (context.hasPermission("system.manage")) {
        where = {
            tenant: context.tenant
        }
    } else {
        where = {
            organization: context.organization,
            tenant: context.tenant
        }
    }

    if (query.entity) {
        if (query.entity.id) {
            where['entity.id'] = query.entity.id
        }

        if (query.entity.type) {
            where['entity.type'] = query.entity.type
        }
    }

    if (query.changes) {
        if (query.changes.field) {
            where['changes.field'] = query.changes.field
        }

        if (query.changes.value) {
            where['changes.value'] = query.changes.value
        }
    }

    if (query.type) {
        where['type'] = query.type
    }

    if (query.user) {
        where.user = await userService.get(query.user, context)
    }

    const count = await db.journal.find(where).count()

    let items
    if (page) {
        items = await db.journal.find(where).skip(page.skip).limit(page.limit).populate('user').sort({ 'timeStamp': -1 })
    } else {
        items = await db.journal.find(where).populate('user').sort({ 'timeStamp': -1 })
    }

    return {
        count: count,
        items: items
    }
}
exports.search = search
