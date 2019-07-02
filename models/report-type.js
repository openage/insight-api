'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: { type: String },
    name: { type: String },
    descripiton: { type: String },
    icon: String,
    permissions: [String],
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reportArea'
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider'
    },
    params: [{
        label: String,
        key: String,
        required: Boolean,
        message: String,

        dbKey: String,
        dbCondition: String,
        type: { type: String },
        format: String,

        value: Object,
        valueKey: String,
        valueLabel: String
    }],
    columns: [{
        label: String,
        key: String,
        dbKey: String,
        type: { type: String },
        format: String,
        style: Object
    }],
    header: {
        title: {
            column: Number,
            text: String,
            format: String,
            style: Object
        },
        organization: {
            column: Number,
            text: String,
            format: String,
            style: Object
        },
        date: {
            column: Number,
            text: String,
            format: String,
            style: Object
        },
        creator: {
            column: Number,
            text: String,
            format: String,
            style: Object
        },
        params: {
            column: Number,
            text: String,
            format: String,
            style: Object
        }
    },
    config: Object,
    status: {
        type: String,
        default: 'active',
        enum: ['new', 'active', 'inactive']
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
