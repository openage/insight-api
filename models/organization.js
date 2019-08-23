'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    shortName: String,
    logo: {
        url: String,
        thumbnail: String
    },
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
