'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: { type: String, required: true },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive']
    }
}
