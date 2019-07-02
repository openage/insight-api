'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: String,
    profile: {
        name: String,
        phone: String,
        email: String,
        dob: Date,
        gender: String
    },
    status: String,
    pic: {
        url: {
            type: String,
            default: null
        }
    },
    role: {
        id: { type: String },
        key: { type: String },
        permissions: [{ type: String }]
    },

    config: Object,

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

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },

    recentLogin: {
        type: Date,
        default: Date.now
    },

    created_At: { type: Date, default: Date.now }

}
