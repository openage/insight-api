var mongoose = require('mongoose')
module.exports = {
    code: String,
    name: String,
    icon: String,
    description: String,
    isHidden: Boolean,
    permissions: [String],
    organization: { // optional
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}
