
const api = require('./api-base')('logs', 'log')

const service = require('../services/logs')
const mapper = require('../mappers/log')

const userService = require('../services/users')

api.get = async (req) => {
    const context = req.context

    if (!context.user && req.headers['x-role-id']) {
        let user = await userService.get({
            role: {
                id: req.headers['x-role-id']
            }
        }, context)

        context.setUser(user)
    }

    const log = await service.create(req.body, context)

    return mapper.toModel(log, req.context)
}

module.exports = api
