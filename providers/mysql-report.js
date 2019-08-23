'use strict'

const sql = require('../helpers/mysql')
var moment = require('moment')

const injectToQuery = (report, context) => {
    let data = {}
    for (let param of report.params) {
        data[param.key] = param.value
    }

    return report.type.config.sql.select.inject(data)
}

const whereClause = (report, context) => {
    let log = context.logger.start('whereClause')

    var whereBuilder = sql.whereBuilder()

    if (report.type.config.isInjectable) {
        return whereBuilder.build()
    }

    report.type.params.forEach(param => {
        let input = report.params.find(i => i.key === param.key)
        if (!input || !input.value) {
            return
        }

        let value = param.valueKey ? input.value[param.valueKey] : input.value

        if (!value) {
            return
        }

        if (param.type === 'date') {
            context.logger.debug(`key: ${param.key} value: ${value} type: ${typeof value}`)
            value = moment(value).format('YYYY-MM-DD')
        }

        if (param.dbCondition === 'in') {
            whereBuilder.add(param.dbKey, `(${value})`, param.dbCondition)
        } else {
            whereBuilder.add(param.dbKey, value, param.dbCondition)
        }
    })

    let clause = whereBuilder.build(report.type.config.sql.where)

    log.debug(clause)

    return clause
}

exports.count = (report, context) => {
    let log = context.logger.start('providers/mysql-report:count')
    let countQuery = report.type.config.sql.count || 'count(*)'
    let queryString = ''
    if (report.type.config.sql.group) {
        queryString = `
            SELECT count(*) as count FROM ( 
                SELECT ${countQuery}
                FROM ${report.type.config.sql.from} 
                ${whereClause(report, context)}
                GROUP BY ${report.type.config.sql.group}
            ) as count`
    } else {
        queryString = `
            SELECT ${countQuery} as count
            FROM ${report.type.config.sql.from} 
            ${whereClause(report, context)}`
    }

    return sql.getCount(report.type.provider.config.db, queryString, context)
}

exports.fetch = async (report, offset, limit, context) => {
    let log = context.logger.start('providers/mysql-report:fetch')
    let groupBy = report.type.config.sql.group ? `GROUP BY ${report.type.config.sql.group}` : ''
    let select = report.type.config.isInjectable ? injectToQuery(report, context) : report.type.config.sql.select

    let queryString = ` 
    SELECT ${select}
    FROM ${report.type.config.sql.from} 
    ${whereClause(report, context)}
    ${groupBy}
    LIMIT ${limit} OFFSET ${offset};`

    let items = await sql.getData(report.type.provider.config.db, queryString, context)

    log.end('fetched')
    return items
}

exports.footer = async (report, context) => {
    let log = context.logger.start('providers/mysql-report:footer')

    if (!report.type.config.sql.summary) {
        return
    }

    let where = whereClause(report, context)

    let queryString = report.type.config.sql.summary.inject(where)

    let items = await sql.getData(report.type.provider.config.db, queryString, context)

    log.end()

    if (!items || !items.length) {
        return
    }

    return items[0]
}
exports.cancel = (id) => {
    return sql.cancel(id)
}
