const userMapper = require('./user')
const organizationMapper = require('./organization')

exports.toModel = (entity, context) => {
    let model = {
        id: entity.id,
        level: entity.level,
        message: entity.message,

        app: entity.app,
        location: entity.location,
        device: entity.device,
        meta: entity.meta,
        error: entity.error,
        context: {},
        user: userMapper.toSummary(entity.user, context),
        organization: organizationMapper.toSummary(entity.organization, context),
        timeStamp: entity.timeStamp
    }

    if (entity.context) {
        model.context.id = entity.context.id
        model.context.ipAddress = entity.context.session.ipAddress

        if (entity.context.session) {
            model.session = {
                id: entity.context.session.id
            }
        }
    }

    return model
}
