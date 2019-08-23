'use strict'
const db = require('../models')
const directory = require('@open-age/directory-client')

const validator = require('validator')

const set = async (model, entity, context) => {
    if (model.status) {
        entity.status = model.status
    }

    if (model.email && validator.isEmail(model.email)) {
        entity.email = model.email.toLowerCase().replace(' ', '')
    }

    if (model.phone && validator.isMobilePhone(model.phone)) {
        entity.phone = model.phone.trim().replace(' ', '')
    }

    if (model.userId) {
        entity.trackingId = model.userId
    }

    if (model.code) {
        entity.code = model.code
    }

    if (model.profile) {
        entity.profile.firstName = model.profile.firstName
        entity.profile.lastName = model.profile.lastName
        entity.profile.gender = model.profile.gender
        entity.profile.dob = model.profile.dob
        model.profile.pic = model.profile.pic || {}
        entity.profile.pic = {
            url: model.profile.pic.url,
            thumbnail: model.profile.pic.thumbnail
        }
    }

    if (model.role) {
        if (entity.role.id && model.role.id && model.role.id !== entity.role.id) {
            // role id cannot be changed
            throw new Error('ID_UNMUTABLE')
        } else if (!entity.role.id && model.role.id) {
            entity.role.id = model.role.id
        }
        if (model.role.key) {
            entity.role.key = model.role.key
        }

        if (model.role.code) {
            entity.role.code = model.role.code
        }

        if (model.role.permissions) {
            entity.role.permissions = model.role.permissions
        }
    }

    if (model.employee) {
        entity.employee = {
            designation: model.employee.designation ? model.employee.designation.name : '',
            department: model.employee.department ? model.employee.department.name : '',
            division: model.employee.division ? model.employee.division.name : ''
        }
    }
}

exports.create = async (model, context) => {
    let user = null

    if (model.trackingId) {
        user = await exports.get({ trackingId: model.trackingId }, context)
    }

    if (!user && model.email) {
        user = await exports.get({ email: model.email }, context)
    }

    if (!user && model.phone) {
        user = await exports.get({ phone: model.phone }, context)
    }

    if (!user) {
        user = new db.user({
            role: {},
            profile: {},
            tenant: context.tenant,
            organization: context.organization,
            status: 'new'
        })
    }

    await set(model, user, context)
    return user.save()
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

exports.getByRoleId = async (roleId, context) => {
    let log = context.logger.start('services/users:getByKey')

    let user = await db.user.findOne({
        'role.id': roleId
    }).populate('organization tenant')

    if (user) { return user }

    let role = await directory.getRoleById(roleId)

    context.logger.debug(role)

    if (!role) {
        throw new Error('role not found')
    }

    if (role.tenant.code !== context.tenant.code) {
        throw new Error('ROLE_ID_INVALID')
    }

    if (role.organization && context.organization && role.organization.code !== context.organization.code) {
        throw new Error('ROLE_ID_INVALID')
    }

    user = await exports.create({
        role: {
            id: role.id,
            code: role.code,
            key: role.key,
            permissions: role.permissions
        },
        code: role.code,
        email: role.email,
        phone: role.phone,
        profile: role.profile,
        address: role.address
    }, context)
    log.end()
    return user
}

exports.get = async (query, context) => {
    let where = {
        tenant: context.tenant,
        organization: context.organization
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.user.findById(query).populate('tenant organization')
        } else {
            if (query === 'me') {
                return context.user
            }
            where.code = query.toLowerCase()
            return db.user.findOne(where).populate('tenant organization')
        }
    }

    if (query._doc) {
        return query
    }

    if (query.id) {
        if (query.id === 'me') {
            return context.user
        }
        return db.user.findById(query).populate('tenant organization')
    }

    if (query.code) {
        where.code = query.code.toLowerCase()
        return db.user.findOne(where).populate('tenant organization')
    }

    if (query.role && query.role.id) {
        return exports.getByRoleId(query.roleId || query.role.id, context)
    }

    if (query.email) {
        let email = query.email.toLowerCase()
        return db.user.findOne({
            email: email,
            tenant: context.tenant
        }).populate('tenant organization')
    }

    if (query.phone) {
        let phone = query.phone
        return db.user.findOne({
            phone: phone,
            tenant: context.tenant
        }).populate('tenant organization')
    }

    if (query.trackingId) {
        where.trackingId = query.trackingId
        return db.user.findOne(where).populate('tenant organization')
    }

    return null
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant,
        organization: context.organization
    }

    if (query.text) {
        if (validator.isEmail(query.text)) {
            where.email = query.text.toLowerCase()
        } else if (validator.isMobilePhone(query.text)) {
            where.phone = query.text.trim().replace(' ', '')
        }
    }

    return {
        items: await (page ? db.user.find(where).skip(page.skip).limit(page.limit) : db.user.find(where)),
        count: await db.user.count(where)
    }
}
