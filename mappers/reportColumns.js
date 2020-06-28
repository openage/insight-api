var moment = require('moment')

exports.formatResult = (item, reportType, context) => {
    let model = {}
    reportType.fields.forEach(column => {
        let value = item[column.key]
        if (!value) {
            return
        }
        switch (column.type) {
            case 'date':
                model[column.key] = moment(value).format(column.format || 'DD-MM-YYYY')
                break

            case 'time':
                model[column.key] = moment(value).format(column.format || 'h:mm a')
                break

            case 'minutes':
                if (value > 0) {
                    var hours = Math.floor(value / 60)
                    var minutes = value % 60
                    model[column.key] = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes)
                } else {
                    model[column.key] = ''
                }
                break

            default:
                model[column.key] = value
                break
        }
    })
    return model
}
