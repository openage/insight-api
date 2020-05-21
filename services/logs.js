'use strict'

const db = require('../models')
const moment = require('moment')

const populate = 'user organization'

exports.create = async (model, context) => {
    const log = context.logger.start('services/logs:create')

    var entity = new db.log({
        level: model.level,
        message: model.message,
        meta: model.meta,
        error: model.error,
        device: model.device,
        app: model.app,
        location: model.location,
        context: {
            id: `${context.id}`,
            ipAddress: context.ipAddress,
            session: context.session ? {
                id: context.session.id
            } : null
        },
        user: context.user,
        organization: context.organization,
        tenant: context.tenant
    })

    await entity.save()

    log.end()

    return entity
}

exports.get = async (query, context) => {
    context.logger.debug('services/logs:get')

    if (!query) {
        return null
    }

    if (typeof query === 'string' && query.isObjectId()) {
        return db.task.findById(query).populate(populate)
    }
    if (query.id) {
        return db.task.findById(query.id).populate(populate)
    }

    return null
}

exports.search = async (query, page, context) => {
    const log = context.logger.start('query')

    const where = {
        organization: context.organization,
        tenant: context.tenant
    }

    if (!query.status) {
        where.status = 'new'
    } else if (query.status !== 'any') {
        where.status = query.status
    }

    if (query.from) {
        where.date = {
            $gte: query.from
        }
    }

    var whereQuery = {}

    if (query.date) {
        whereQuery.timeStamp = {
            $gte: moment(query.date).startOf('day'),
            $lt: moment(query.date).endOf('day')
        }
    }

    switch (query.level || 'all') {
        case 'all':
            whereQuery.level = {
                $regex: /info|error/,
                $options: 'i'
            }
            break
        case 'd': break
        default:
            whereQuery.level = {
                $regex: query.level,
                $options: 'i'
            }
            break
    }

    if (query.message) {
        whereQuery.message = {
            $regex: query.message,
            $options: 'i'
        }
    }

    if (query.location) {
        whereQuery.location = {
            $regex: query.location,
            $options: 'i'
        }
    }

    if (query.app) {
        whereQuery.app = query.app
    }

    let result = {}

    if (!page || !page.limit) {
        return {
            items: await db.log.find(whereQuery).sort({ timestamp: -1 }).populate(populate)
        }
    } else {
        result.items = await db.log.find(whereQuery).sort({ timestamp: -1 }).limit(page.limit).skip(page.skip).populate(populate)
        result.count = await db.log.count(whereQuery)
    }

    log.end()

    return result
}
