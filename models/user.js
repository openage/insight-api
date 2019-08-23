'use strict'
var mongoose = require('mongoose')
module.exports = {
    role: {
        id: String,
        key: String,
        code: String,
        permissions: [{
            type: String
        }]
    },
    email: String,
    phone: String,
    code: String,
    profile: {
        firstName: String,
        lastName: String,
        gender: String,
        dob: Date,
        pic: {
            url: String,
            thumbnail: String
        }
    },

    config: Object,
    status: String,
    employee: {
        designation: {
            type: String,
            default: ''
        },
        department: {
            type: String,
            default: ''
        },
        division: {
            type: String,
            default: ''
        }
    },

    lastSeen: Date,
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}
