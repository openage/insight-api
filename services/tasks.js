'use strict'

const logger = require('@open-age/logger')('services/tasks')
const db = require('../models')

const set = (model, entity, context) => {
    if (model.status) {
        entity.status = model.status
    }

    if (model.message && entity.status === 'error') {
        entity.error = model.message
    }
}

const create = async (model, context) => {
    const log = logger.start('create')

    var task = new db.task({
        data: model.data,
        entity: model.entity,
        action: model.action,
        assignedTo: model.assignedTo,
        date: model.date || new Date(),
        employee: model.employee,
        device: model.device,
        meta: model.meta,
        organization: context.organization,
        status: model.status || 'new'
    })

    return task.save()
}

const get = async (query, context) => {
    context.logger.debug('services/tasks:get')

    if (!query) {
        return null
    }

    if (typeof query === 'string' && query.isObjectId()) {
        return db.task.findById(query)
    }
    if (query.id) {
        return db.task.findById(query.id)
    }

    return null
}

const search = async (query, context) => {
    const log = logger.start('query')
    query.organization = context.organization

    const items = await db.task.find(query)

    return items
}

const update = async (id, model, context) => {
    const log = logger.start('update')

    let entity = await db.task.findById(id)
    set(model, entity, context)
    return entity.save()
}

exports.get = get
exports.create = create
exports.search = search
exports.update = update
