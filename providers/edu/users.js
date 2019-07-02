'use strict'

const directoryConfig = require('config').get('providers.edu')
const logger = require('@open-age/logger')('@edu/client')
const Client = require('node-rest-client-promise').Client
const client = new Client()

let parsedConfig = (config) => {
    config = config || {}

    return {
        url: config.url || directoryConfig.url,
        tenantKey: config.api_key || directoryConfig.api_key,
        lastSyncDate: config.lastSyncDate
    }
}

exports.get = (roleKey, roleId) => {
    let log = logger.start('getMyRole')

    const key = roleKey || directoryConfig.tenantKey
    const id = roleId || 'current'

    let config = parsedConfig()
    let args = {
        headers: {
            'Content-Type': 'application/json',
            'x-role-key': key
        }
    }

    const url = `${config.url}/users/${id}`
    log.info(`getting role from ${url}`)

    return new Promise((resolve, reject) => {
        return client.get(url, args, (data, response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(response.statusMessage))
            }

            if (!data) {
                return reject(new Error())
            }

            let currentRole = data.currentRole

            let user = {
                id: data.id,
                code: data.code,
                profile: {
                    name: data.name,
                    gender: data.gender,
                    email: data.email,
                    mobile: data.mobile,
                    pic: {
                        url: data.imageBoxUrl
                    }
                },
                role: {
                    id: currentRole.id,
                    code: currentRole.code,
                    key: currentRole.apikey,
                    permissions: []
                },

                status: currentRole.status
            }

            if (currentRole.permissions) {
                currentRole.permissions.forEach(permission => {
                    user.role.permissions.push(permission)
                })
            }

            if (currentRole.roleType) {
                user.type = currentRole.roleType.name

                currentRole.roleType.permissions.forEach(item => {
                    if (item.entityId) {
                        user.role.permissions.push(`${item.entityType}.${item.permissionType.name}:${item.entityId}`)
                    } else {
                        user.role.permissions.push(`${item.entityType}.${item.permissionType.name}`)
                    }
                })
            }

            if (currentRole.specialRole) {
                if (currentRole.specialRole.hasTeam) {
                    user.role.permissions.push('team.manage')
                }

                if (currentRole.specialRole.hasMentees) {
                    user.role.permissions.push('mentees.manage')
                }
            }

            if (data.type === 'employee') {
                user.employee = {
                    department: {
                        id: currentRole.department.id,
                        code: currentRole.department.code,
                        name: currentRole.department.name
                    },
                    designation: {
                        id: currentRole.designation.id,
                        code: currentRole.designation.code,
                        name: currentRole.designation.name
                    },
                    division: {
                        id: currentRole.division.id,
                        code: currentRole.division.code,
                        name: currentRole.division.name
                    }
                }
            }

            user.organization = {
                id: currentRole.organization.id,
                code: currentRole.organization.code,
                config: {
                    culture: currentRole.organization.culture
                }
            }

            return resolve(user)
        })
    })
}
