
var mongoose = require('mongoose')
module.exports = {
    code: String,
    name: String,
    description: String,
    handler: String,
    config: Object,

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}
