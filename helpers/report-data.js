const dateHelper = require('./dates')
const contextHelper = require('./context-builder')
const mongoose = require('mongoose')

const convert = (value, param, providerType, context) => {
    switch (providerType) {
        case 'mssql-report':
            break

        case 'mysql-report':
            if (param.dbCondition == 'in') {
                let i = 0
                value.forEach(item => {
                    value[i] = item.replace(/'/g, '')
                    i++
                })

                return value
            }
            break

        case 'mongodb-report':
            if (Array.isArray(value)) {
                if (value.length > 1) {
                    value = {
                        '$in': value
                    }
                } else {
                    let val = value[0].replace("'", '')
                    value = val.replace("'", '')
                }
                return value
            }
            break
    }

    switch (param.type) {
        case 'date':
            value = dateHelper.date(value).bod()
            break

        case 'month':
            value = {
                $gt: dateHelper.date(value).bom(),
                $lt: dateHelper.date(value).eom()
            }
            break

        case 'regex':
            value = {
                '$regex': `^${value}`,
                '$options': 'i'
            }
            break

        case 'object':
        case 'objectId':
            value = mongoose.Types.ObjectId(value)
            break

        case 'int':
        case 'integer':
        case 'number':
            if (typeof value !== 'number') {
                value = parseInt(value)
            }
            break
    }

    return value
}

const getParams = (master, context) => {
    let params = master.params.map(i => {
        return {
            key: i.key,
            dbKey: i.dbKey,
            dbCondition: i.dbCondition,
            type: i.type,
            format: i.format,
            value: i.value
        }
    })

    params = JSON.parse(JSON.stringify(params).inject({
        context: context.toObject()
    }))
    return params
}

const getFilters = (reportType, query, context) => {
    var filters = {}
    query.forEach(param => {
        let filter = reportType.filters.find(i => i.key === param.key)

        if (!filter) {
            return
        }

        filters[param.key] = filter.valueKey ? param.value[filter.valueKey] : param.value
    })

    return filters
}

const getConfig = (master, context) => {
    if (typeof master.config === 'string') {
        return JSON.parse(master.config)
    }

    return master.config
}

const toModel = (item, reportType, context) => {
    reportType.fields.forEach(field => {
        if (field.type === 'date') {
            let value = item[field.key]
            if (value) {
                item[field.key] = dateHelper.date(value).toString(field.format)
            }
        }

        if (field.type === 'time') {
            let value = item[field.key]
            if (value) {
                item[field.key] = dateHelper.time(value).toString(field.format || 'h:mm a')
            }
        }
        if (field.type === 'minutes') {
            let value = item[field.key]
            if (value) {
                if (value > 0) {
                    var hours = Math.floor(value / 60)
                    var minutes = value % 60
                    item[field.key] = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes)
                } else {
                    item[field.key] = ''
                }
            }
        }
    })
    return item
}

module.exports = (reportType, query, context) => {
    const filters = getFilters(reportType, query, context)

    const master = reportType.type

    return {
        config: () => {
            return getConfig(master, context)
        },

        connection: () => {
            return master.provider.config.db
        },
        params: () => {
            return getParams(master, context)
        },

        value: (param) => {
            let value = filters[param.key] || param.value

            if (!value) {
                return
            }

            return convert(value, param, master.provider.handler, context)
        },
        toModel: (row) => {
            return toModel(row, reportType, context)
        }
    }
}
