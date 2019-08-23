'use strict'
var mongoose = require('mongoose')

module.exports = {
    message: String,
    entity: {
        id: String,
        code: String,
        type: { type: String },
        name: String,
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'organization'
        }
    },
    meta: Object,
    type: { type: String }, // created, updated, removed, message
    changes: [{
        field: String,
        type: { type: String },
        value: String,
        oldValue: String,
    }],
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
        //    required: true TODO: add tenant to prod
    }
}
