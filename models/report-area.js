var mongoose = require('mongoose')
module.exports = {
    code: String,
    name: String,
    icon: String,
    permissions: [String],
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}
