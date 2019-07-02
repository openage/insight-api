'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: String,
    name: String,
    shortName: String,
    config: Object,
    status: {
        type: String,
        default: 'active',
        enum: ['new', 'active', 'inactive']
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
        //    required: true TODO: add tenant to prod
    }
}
