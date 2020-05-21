'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: { type: String },
    name: { type: String },
    description: { type: String },
    icon: String,
    order: Number,
    view: String,
    autoSearch: Object,
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider'
    },
    params: [{
        label: String,
        key: String,
        required: Boolean,
        message: String,
        autoFill: Object,
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
        ascending: { type: Boolean, default: true },
        style: Object,
        icon: String,
        isEmit: Boolean
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
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}
