'use strict'

const sql = require('../helpers/mysql')
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

const procedureWhereClause = (report, context) => {
    let log = context.logger.start('procedureWhereClause')

    var whereBuilder = ''

    report.type.params.forEach(param => {
        let found = true
        let input = report.params.find(i => i.key === param.key)
        if (!input || !input.value) {
            found = false
        }

        let value
        if (found) {

            value = param.valueKey ? input.value[param.valueKey] : input.value

            if (!value) {
                found = false
            }
        }

        if (found) {

            if (param.type === 'date') {
                context.logger.debug(`key: ${param.key} value: ${value} type: ${typeof value}`)
                value = moment(value).format('YYYY-MM-DD')
            }

            if (param.dbCondition == 'in') {
                let i = 0
                value.forEach(item => {
                    value[i] = item.replace(/'/g, '');
                    i++
                })
            }
            whereBuilder = whereBuilder + '"' + value + '",'
        } else {
            whereBuilder = whereBuilder + null + ','
        }

        // if (param.type === 'date') {
        //     context.logger.debug(`key: ${param.key} value: ${value} type: ${typeof value}`)
        //     value = moment(value).format('YYYY-MM-DD')
        // }

    })

    if (whereBuilder != '') {
        whereBuilder = whereBuilder.substr(0, whereBuilder.length - 1)
        // whereBuilder = whereBuilder.replace(/^"(.*)"$/, '$1');
    }

    log.debug(whereBuilder)

    return whereBuilder;
}

exports.count = (report, context) => {

    let log = context.logger.start('providers/mysql-report:count')
    if (report.type.config.procedure) {
        let queryString = `call ${report.type.config.procedure.count}(${procedureWhereClause(report, context)})`
        return sql.getProcedureCount(report.type.provider.config.db, queryString, context)
    } else {
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
}

exports.fetch = async (report, offset, limit, context) => {

    let log = context.logger.start('providers/mysql-report:fetch')
    if (report.type.config.procedure) {
        let queryString

        if (offset >= 0 && limit) {
            let clause = procedureWhereClause(report, context)
            if (clause == '')
                queryString = `call ${report.type.config.procedure.fetch}(${limit},${offset})`
            else
                queryString = `call ${report.type.config.procedure.fetch}(${limit},${offset},${clause})`
        } else {
            queryString = `call ${report.type.config.procedure.fetchAll}(${procedureWhereClause(report, context)})`
        }

        let items = await sql.getProcedureData(report.type.provider.config.db, queryString, context)

        log.end('fetched')
        return items
    } else {
        let groupBy = report.type.config.sql.group ? `GROUP BY ${report.type.config.sql.group}` : ''

        let queryString

        if (limit && offset) {
            if (report.type.config.sql.sort) {
                queryString = ` 
                SELECT ${report.type.config.sql.select}
                FROM ${report.type.config.sql.from} 
                ${whereClause(report, context)}
                ${groupBy}
                ORDER BY ${report.type.config.sql.sort}
                LIMIT ${limit} OFFSET ${offset};`
            } else {
                queryString = ` 
        SELECT ${report.type.config.sql.select}
        FROM ${report.type.config.sql.from} 
        ${whereClause(report, context)}
        ${groupBy}
        LIMIT ${limit} OFFSET ${offset};`
            }
        } else {
            if (report.type.config.sql.sort) {
                queryString = ` 
                SELECT ${report.type.config.sql.select}
                FROM ${report.type.config.sql.from} 
                ${whereClause(report, context)}
                ${groupBy}
                ORDER BY ${report.type.config.sql.sort};`
            } else {
                queryString = ` 
        SELECT ${report.type.config.sql.select}
        FROM ${report.type.config.sql.from} 
        ${whereClause(report, context)}
        ${groupBy};`
            }
        }



        let items = await sql.getData(report.type.provider.config.db, queryString, context)

        log.end('fetched')
        return items
    }
}

exports.footer = async (report, context) => {
    let log = context.logger.start('providers/mysql-report:footer')

    if (!report.type.config.sql || !report.type.config.sql.summary) {
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
