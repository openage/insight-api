'use strict'
const db = require('../models')
const locks = require('./locks')

const defaultConfig = require('config').get('organization')

const searchInConfig = (identifier, config) => {
    var keys = identifier.split('.')
    var value = config

    for (var key of keys) {
        if (!value[key]) {
            return null
        }
        value = value[key]
    }

    return value
}

const create = async (claims, logger) => {
    let context = {
        logger: logger || claims.logger,
        config: defaultConfig,
        permissions: []
    }

    let log = context.logger.start('context-builder:create')
    context.setOrganization = async (organization) => {
        if (!organization) {
            return
        }
        if (organization._doc) {
            context.organization = organization
        } else if (organization.id) {
            context.organization = await db.organization.findOne({ _id: organization.id })
        } else if (organization.key) {
            context.organization = await db.organization.findOne({ key: organization.key })
        } else if (organization.code) {
            context.organization = await db.organization.findOne({ code: organization.code })
        }

        if (context.organization.config) {
            context.config = context.organization.config
            context.config.timeZone = context.config.timeZone || 'IST'
        }

        context.logger.context.organization = {
            id: context.organization.id,
            code: context.organization.code
        }
    }

    context.setUser = async (user) => {
        if (!user) {
            return
        }
        if (user._doc) {
            context.user = user
        } else if (user.id) {
            context.user = await db.user.findOne({ _id: user.id })
        }

        // context.permissions.push(user.userType)

        context.logger.context.user = {
            id: context.user.id,
            code: context.user.code
        }
    }

    context.setRole = async (role) => {
        if (!role) {
            return
        }

        context.role = role

        role.permissions = role.permissions || []

        role.permissions.forEach(item => context.permissions.push(item))
    }
    await context.setOrganization(claims.organization)
    await context.setUser(claims.user)
    await context.setRole(claims.role)

    context.getConfig = (identifier, defaultValue) => {
        var value = searchInConfig(identifier, context.config)
        if (!value) {
            value = searchInConfig(identifier, defaultConfig)
        }
        if (!value) {
            value = defaultValue
        }
        return value
    }

    context.hasPermission = (request) => {
        if (!request) {
            return false
        }

        let items = Array.isArray(request) ? request : [request]

        return context.permissions.find(permission => {
            return items.find(item => item.toLowerCase() === permission)
        })
    }

    context.where = () => {
        let clause = {}

        if (context.organization) {
            clause.organization = context.organization.id.toObjectId()
        }
        let filters = {}

        filters.add = (field, value) => {
            if (value) {
                clause[field] = value
            }
            return filters
        }

        filters.clause = clause

        return filters
    }

    context.lock = async (resource) => {
        return locks.acquire(resource, context)
    }

    log.end()

    return context
}

exports.serializer = async (context) => {
    let serialized = {}

    if (context.user) {
        serialized.userId = context.user.id
    }

    if (context.organization) {
        serialized.organizationId = context.organization.id
    }

    return serialized
}

exports.deserializer = async (serialized, logger) => {
    let claims = {}

    if (serialized.userId) {
        claims.user = {
            id: serialized.userId
        }
    }

    if (serialized.organizationId) {
        claims.organization = {
            id: serialized.organizationId
        }
    }

    return create(claims, logger)
}

exports.create = create
