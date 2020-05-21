'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: { type: String },
    name: { type: String },
    description: { type: String },
    icon: String,
    order: Number,
    view: String,
    graph: {
        color: String,
        view: String,
        align: String
    },
    widget: {
        code: String,
        title: String,
        style: Object,
        class: String,
        xAxisLabel: String,
        yAxisLabel: String
    },
    container: {
        code: String,
        class: String,
        style: Object
    },

    permissions: [String],
    autoSearch: Object,
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reportArea'
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider'
    },
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reportMaster'
    },
    params: [{
        label: String,
        key: String,
        control: String,
        options: [{
            label: String,
            value: String
        }],
        style: Object,
        required: Boolean,
        message: String,
        autoFill: Object,

        dbKey: String,
        dbCondition: String,
        type: { type: String },
        format: String,
        isOr: Boolean,
        regex: Boolean,

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
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}
