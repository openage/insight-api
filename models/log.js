'use strict'
var mongoose = require('mongoose')

module.exports = {
    level: String,
    message: String,
    meta: Object,

    app: String,
    location: String,
    report: String,
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'role'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    }
}
