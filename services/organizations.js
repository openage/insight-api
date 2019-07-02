'use strict'
const uuid = require('uuid')
const offline = require('@open-age/offline-processor')
const db = require('../models')

exports.create = async (model, context) => {
    var data = {
        code: model.code,
        name: model.name,
        externalUrl: model.externalUrl,
        // EmpDb_Org_id: model.orgId || model.id,
        externalId: model.orgId || model.id,
        activationKey: uuid.v1(),
        status: model.status
    }

    let organization = new db.organization(data)
    organization = await organization.save()
    await context.setOrganization(organization)
    context.processSync = true

    context.logger.info(`new organization create ${organization.id}`)
    await offline.queue('organization', 'create', { id: organization.id }, context)

    return organization
}
const getByCode = async (code, context) => {
    return db.organization.findOne({ code: code })
}

exports.getByCode = getByCode
