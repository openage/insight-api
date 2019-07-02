'use strict'
// const tenants = require('./tenants')

const db = require('../models')
const organizations = require('./organizations')
let directory = require('@open-age/directory-client')
const contextBuilder = require('../helpers/context-builder')

exports.getByRoleKey = async (roleKey, logger) => {
    const log = logger.start('services/users:getFromDirectory')
    let user = await db.user.findOne({ 'role.key': roleKey }).populate('organization')
    if (user) {
        return user
    }

    const directoryRole = await directory.roles.get(roleKey)
    logger.debug(directoryRole)

    if (!directoryRole) {
        log.error(`could not find any role with key ${roleKey}`)
        return null
    }

    // if (!directoryUser.employee) {
    //     log.error(`could not find any employee with key ${roleKey}`)
    //     return null
    // }

    let context = await contextBuilder.create({}, logger)

    // context.tenant = await tenants.getByCode(role.tenant.code, context) ||
    //     await tenants.create(role.tenant, context)

    if (directoryRole.organization) {
        let organization = await organizations.getByCode(directoryRole.organization.code, context)

        if (!organization) {
            organization = await organizations.create(directoryRole.organization, context)
        }

        context.organization = organization
    }

    user = await db.user.findOne({ 'role.id': `${directoryRole.id}` }).populate('organization')

    if (!user && directoryRole.code) {
        user = await db.user.findOne({
            'role.code': directoryRole.code,
            organization: context.organization
        }).populate('organization')
    }

    if (!user) {
        var model = populateModel(directoryRole, context)
        user = new db.user(model)
    }

    let role = directoryRole
    user.role = user.role || {}
    user.role.id = `${role.id}`
    user.role.code = role.code
    user.role.key = role.key
    user.role.permissions = role.permissions || []

    await user.save()
    log.end()
    return user
}

const populateModel = (role, context) => {
    var model = {
        status: 'active',
        code: role.code,
        organization: context.organization
    }

    const profile = role.employee.profile

    model.profile = {
        name: `${profile.firstName} ${profile.lastName || ''}`.trim(),
        gender: profile.gender,
        phone: profile.phone,
        email: profile.email,
        dob: profile.dob,
        pic: profile.pic
    }

    if (role.employee) {
        model.employee = {}
        if (role.employee.department) {
            model.employee.department = role.employee.department.name
        }
        if (role.employee.division) {
            model.employee.division = role.employee.division.name
        }
        if (role.employee.designation) {
            model.employee.designation = role.employee.designation.name
        }
    }

    return model
}
