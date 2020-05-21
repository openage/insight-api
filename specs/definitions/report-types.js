module.exports = {
    code: String,
    name: String,
    description: String,
    icon: String,
    view: String,
    permissions: [String],
    autoSearch: Object,
    provider: {
        id: String,
        code: String,
        name: String
    },
    params: [{
        label: String,
        key: String,
        required: Boolean,
        message: String,
        autoFill: Object,
        type: String,
        value: Object,
        valueKey: String,
        valueLabel: String
    }],
    columns: [{
        label: String,
        key: String,
        type: String,
        format: String,
        style: Object,
        icon: String
    }],
    config: {
        sheet: String
    },
    timeStamp: Date,
    area: {
        id: String,
        code: String,
        name: String
    }
}
