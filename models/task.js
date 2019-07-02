'use strict'
var mongoose = require('mongoose')

module.exports = {
    time: Date,
    assignedTo: String,
    meta: Object,
    error: Object,
    progress: Number,
    status: String
}
