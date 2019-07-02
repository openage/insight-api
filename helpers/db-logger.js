// const db = require('../models')

module.exports = async (level, message, meta, context) => {
    try {
        let model = {
            level: level,
            message: message,
            meta: meta,
            app: process.env.APP
        }

        if (context) {
            if (context.location) {
                model.location = context.location
                if (model.location.startsWith('GET /api/logs')) {
                    return
                }
            }

            if (context.user) {
                model.user = context.user.id || context.user
            }

            if (context.organization) {
                model.organization = context.organization.id || context.organization
            }
        }

        // new db.log(model).save()
    } catch (err) { }
}
