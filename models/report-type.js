'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: { type: String },
    name: { type: String },
    description: { type: String },
    icon: String,
    order: Number,
    // view: String,
    // graph: {
    //     color: String,
    //     view: String,
    //     align: String
    // },
    widget: {
        code: String, // is the widget code that renders the report
        title: String,
        style: Object,
        class: String,
        /**
         * Config: it is set of config used be the widget to render itself.
         *
         */
        config: Object
    },
    container: {
        code: String,
        class: String,
        style: Object
    },

    permissions: [String], // as set of permission that the user must have to view this report
    /**
     * where would this report show up, example dashboard|root
     */
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reportArea'
    },
    // provider: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'provider'
    // },
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reportMaster'
    },
    /**
     * It is a collection of filter that the widget would render
     */
    filters: [{
        label: String, // the label to show on the widget
        key: String, // the key to build the where object (must match it to the provider's params)
        control: String, // the control(code) that the widget renders to fetch the value
        isHidden: Boolean, // if hidden this filter won't show up
        config: Object, // min value, max value, required, readonly , options [{ label: String, value: String }],etc
        style: Object,
        type: { type: String },
        format: String,
        value: Object,
        valueKey: String, // the field of the control value that needs to be picked
        valueLabel: String // the field of the control that that is used to render in filter summary
    }],

    /**
     * a set of re-mappings of the data object to the widget model.
     */
    fields: [{
        label: String, // the label to show on the widget
        icon: String, // icon to represent the column
        key: String, // the key for the widget.
        description: String, // kind of help text about the column
        formula: String, // this can be the key of the object returned from the provider or can be formula combining multiple fields of the object
        // dbKey: String,
        type: { type: String },
        format: String, // used to convert data to string
        ascending: { type: Boolean, default: true },
        style: Object, // a JSON object that would be used by widget to style the value
        /**
         * Config: it is set of config used by the widget to render the column.
         *   click: {
         *       url: 'https://app.aqauateams.com/master/employees/:key',
         *       open: 'popup|new-tab|current'
         *   }; the items in the url will be injected
         */
        config: Object
    }],
    download: {
        excel: {
            sheet: String,
            headers: Object,
            config: Object
        },
        csv: {
            headers: Object,
            config: Object
        },
        pdf: {
            headers: Object,
            config: Object // layout: 'portrait', size: ''
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
