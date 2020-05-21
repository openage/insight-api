var moment = require('moment')

exports.formatResult = (item, report, context) => {
    report.type.columns.forEach(column => {
        if (column.type === 'date') {
            let value = item[column.key]
            if (value) {
                item[column.key] = moment(value).format(column.format || 'DD-MM-YYYY')
            }
        }

        if (column.type === 'time') {
            let value = item[column.key]
            if (value) {
                item[column.key] = moment(value).format(column.format || 'h:mm a')
            }
        }
        if (column.type === 'minutes') {
            let value = item[column.key]
            if (value) {
                if (value > 0) {
                    var hours = Math.floor(value / 60)
                    var minutes = value % 60
                    item[column.key] = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes)
                } else {
                    item[column.key] = ''
                }
            }
        }
    })
    return item
}
