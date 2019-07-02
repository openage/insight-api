'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: {
        type: String,
        index: true,
        unique: true
    },
    key: {
        type: String,
        required: [true, 'role key required'],
        index: true,
        unique: true
    },
    status: {
        type: String,
        default: 'new',
        enum: ['in-complete', 'new', 'active', 'inactive', 'archived', 'blocked']
    },
    permissions: [{ type: String }], // additional permissions
    user: { type: Object },
    employee: { type: Object },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    }
}
