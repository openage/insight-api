'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: { type: String },
    name: { type: String },
    description: { type: String },
    icon: String,
    // order: Number,
    // view: String,
    // autoSearch: Object,
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider'
    },

    /**
     *  it is set of params that goes into the where clause
     */
    params: [{
        key: String, // the field to be pulled from the input object
        dbKey: String,
        dbCondition: String, // the db comparator, can be one of following `=`, `>`, `<`, `in` etc
        type: { type: String }, // the type of value (default string) to be inserted in the where clause
        format: String, // the formatter used when converting to string
        value: Object // the default value (if not specified in the report)
        // label: String,
        // valueKey: String,
        // valueLabel: String,
        // required: Boolean,
        // message: String,
        // autoFill: Object,
    }],

    /**
     * a set of mappings between the db and application.
     */
    columns: [{
        key: String, // the field name in the returned object. It is a flattened model; e.g. for a key like `address-city` an `address` object would be created with field `city`
        dbKey: String, // the filed returned by the db
        type: { type: String }, // defines how the value is parsed
        ascending: { type: Boolean, default: true }
        // label: String,
        // format: String,
        // style: Object,
        // icon: String,
        // isEmit: Boolean
    }],

    /**
     * defines the queries and other configs that the provider uses to fetch the data.
     * It may look like this (assuming MYSQL provider)
     *  - select:
     *  - from:
     *  - where:
     *  - group:
     *  - sort:
     *  - summary:
    */
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
