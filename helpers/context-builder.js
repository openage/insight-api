'use strict'
const db = require('../models')
const locks = require('./locks')

const defaultConfig = require('config').get('organization')

const directory = require('@open-age/directory-client')
const tenants = require('../services/tenants')
const organizations = require('../services/organizations')
const users = require('../services/users')

const getUserByRoleKey = async (roleKey, logger) => {
    let log = logger.start('getUserByRoleKey')

    let user = await db.user.findOne({
        'role.key': roleKey
    }).populate('organization tenant')

    if (user) { return user }

    let role = await directory.getRole(roleKey, { logger: log })

    log.debug(role)

    if (!role) {
        throw new Error('ROLE_KEY_INVALID')
    }

    const context = await exports.create({}, logger)

    if (role.tenant) {
        let tenant = await tenants.get({
            code: role.tenant.code
        }, context)

        if (!tenant) {
            tenant = await tenants.create(role.tenant, context)
        }

        await context.setTenant(tenant)
    }

    if (role.organization) {
        let organization = await organizations.get({
            code: role.organization.code
        }, context)

        if (!organization) {
            organization = await organizations.create(role.organization, context)
        }
        await context.setOrganization(organization)
    }

    user = await users.create({
        role: {
            id: role.id,
            code: role.code,
            key: role.key,
            permissions: role.permissions
        },
        code: role.code,
        email: role.email,
        phone: role.phone,
        profile: role.profile
    }, context)

    log.end()
    return user
}

exports.create = async (claims, logger) => {
    let context = {
        id: claims.id,
        logger: logger || claims.logger,
        config: defaultConfig,
        permissions: []
    }

    let log = context.logger.start('context-builder:create')

    if (claims.role && claims.role.key) {
        claims.user = await getUserByRoleKey(claims.role.key, log)
    }

    context.setUser = async (user) => {
        if (!user) {
            return
        }
        if (user._doc) {
            context.user = user
        } else if (user.id) {
            context.user = await db.user.findById(user.id).populate('organization tenant')
        }

        if (!context.tenant) {
            await context.setTenant(context.user.tenant)
        }

        if (!context.organization) {
            await context.setOrganization(context.user.organization)
        }

        if (user.role && user.role.permissions) {
            context.permissions.push(...user.role.permissions)
        }

        context.logger.context.user = {
            id: context.user.id,
            code: context.user.code
        }
    }

    context.setOrganization = async (organization) => {
        if (!organization) {
            return
        }
        if (organization._doc) {
            context.organization = organization
        } else if (organization.id) {
            context.organization = await db.organization.findById(organization.id).populate('tenant')
        } else if (organization.key) {
            context.organization = await db.organization.findOne({ key: organization.key }).populate('tenant')
        } else if (organization.code) {
            context.organization = await db.organization.findOne({
                code: organization.code,
                tenant: context.tenant
            }).populate('tenant')
        } else {
            context.organization = await db.organization.findById(organization).populate('tenant')
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

    context.setTenant = async (tenant) => {
        if (!tenant) {
            return
        }
        if (tenant._doc) {
            context.tenant = tenant
        } else if (tenant.id) {
            context.tenant = await db.tenant.findOne({ _id: tenant.id }).populate('owner')
        } else if (tenant.key) {
            context.tenant = await db.tenant.findOne({ key: tenant.key }).populate('owner')
        } else if (tenant.code) {
            context.tenant = await db.tenant.findOne({ code: tenant.code }).populate('owner')
        }

        if (!context.tenant) { return }

        context.logger.context.tenant = {
            id: context.tenant.id,
            code: context.tenant.code
        }
    }

    await context.setTenant(claims.tenant)
    await context.setOrganization(claims.organization)
    await context.setUser(claims.user)

    context.lock = async (resource) => {
        return locks.acquire(resource, context)
    }

    context.setProgress = async (value, outOf) => {
        if (!context.task) {
            return
        }

        let task = await db.task.findById(context.task.id)
        task.progress = Math.floor(100 * value / outOf)
        context.task = await task.save()
    }

    log.end()

    return context
}

exports.serializer = async (context) => {
    let serialized = {}

    if (context.user) {
        serialized.userId = context.user.id
    }

    if (context.tenant) {
        serialized.tenantId = context.tenant.id
    }

    if (context.organization) {
        serialized.organizationId = context.organization.id
    }

    return serialized
}

exports.deserializer = async (claims, logger) => {
    return exports.create(claims, logger)
}
