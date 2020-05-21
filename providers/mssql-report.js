'use strict'

const sql = require('../helpers/mssql')
var moment = require('moment')

const whereClause = (report, context) => {
    let log = context.logger.start('whereClause')

    var whereBuilder = sql.whereBuilder()

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
            value = moment(value).format('YYYY-MM-DD')
        }

        whereBuilder.add(param.dbKey, value, param.dbCondition)
    })

    let clause = whereBuilder.build(report.type.config.sql.where)

    log.debug(clause)

    return clause
}

exports.count = (report, context) => {
    let log = context.logger.start('providers/mssql-report:count')
    let countQuery = report.type.config.sql.count || 'count(*)'
    let queryString = ''
    if (report.type.config.sql.group) {
        queryString = `
            SELECT count(*) as count FROM ( 
                SELECT ${countQuery} as count
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
    let log = context.logger.start('providers/mssql-report:fetch')
    let groupBy = report.type.config.sql.group ? `GROUP BY ${report.type.config.sql.group}` : ''

    let queryString = ` 
      SELECT ${report.type.config.sql.select}
      FROM ${report.type.config.sql.from} 
      ${whereClause(report, context)}
      ${groupBy}`

    if (report.type.config.sql.sort) {
        if (offset >= 0 && limit) {
            queryString = ` 
              SELECT TOP ${limit} * FROM(
              SELECT ${report.type.config.sql.select}, ROW_NUMBER() OVER(ORDER BY ${report.type.config.sql.sort}) AS __i
              FROM ${report.type.config.sql.from} 
              ${whereClause(report, context)}
              ${groupBy}
              ) __temp WHERE __i >= ${offset}; `
        } else {
            queryString = ` 
              SELECT ${report.type.config.sql.select}, ROW_NUMBER() OVER(ORDER BY ${report.type.config.sql.sort}) AS __i
              FROM ${report.type.config.sql.from} 
              ${whereClause(report, context)}
              ${groupBy}`
        }
    } else if (offset >= 0 && limit) {
        queryString = ` 
          SELECT TOP ${limit} * FROM(
          SELECT ${report.type.config.sql.select}
          FROM ${report.type.config.sql.from} 
          ${whereClause(report, context)}
          ${groupBy}
          ) __temp WHERE __i >= ${offset}; `
    }

    let items = await sql.getData(report.type.provider.config.db, queryString, context)

    log.end('fetched')
    return items
}

exports.footer = async (report, context) => {
    let log = context.logger.start('providers/mssql-report:footer')

    if (!report.type.config.sql.summary || !report.type.config.sql.summary.select || !report.type.config.sql.summary.from) {
        return
    }

    let where = whereClause(report, context)

    let queryString = `${report.type.config.sql.summary.select} ${report.type.config.sql.summary.from} ${where} ${report.type.config.sql.summary.group ? report.type.config.sql.summary.group : ''}`

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
