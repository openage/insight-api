'use strict'
var mongoose = require('mongoose')

module.exports = {
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reportType'
    },
    requestedAt: Date,
    startedAt: Date,
    completedAt: Date,

    filePath: String,
    fileUrl: String,

    count: Number,

    params: [{
        label: String,
        key: String,
        value: Object,
        valueKey: String,
        valueLabel: String
    }],

    error: String,
    status: {
        type: String,
        enum: ['draft', 'new', 'in-progress', 'ready', 'cancelled', 'errored']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    }

}
