'use strict'
var mongoose = require('mongoose')

module.exports = {
    level: String,
    message: String,

    device: Object,
    meta: Object,
    error: Object,
    app: String,
    location: String,

    context: {
        id: String,
        ipAddress: String,
        session: {
            id: String
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}
