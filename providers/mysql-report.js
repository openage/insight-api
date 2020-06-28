'use strict'

const mysql = require('../helpers/mysql')
var dataHelper = require('../helpers/report-data')

const whereClause = (data, config, context) => {
    let log = context.logger.start('whereClause')

    let clause

    if (config.procedure) {
        data.params.forEach(param => {
            let value = data.value(param)

            if (value) {
                clause = clause + '"' + value + '",'
            } else {
                clause = clause + null + ','
            }
        })

        if (clause != '') {
            clause = clause.substr(0, clause.length - 1)
        }
    } else {
        var whereBuilder = mysql.whereBuilder()

        data.params.forEach(param => {
            let value = data.value(param)
            if (!value) {
                return
            }

            if (param.dbCondition === 'in') {
                whereBuilder.add(param.dbKey, `(${value})`, param.dbCondition)
            } else {
                whereBuilder.add(param.dbKey, value, param.dbCondition)
            }
        })

        clause = whereBuilder.build(config.where)
    }

    log.debug(clause)

    return clause
}

module.exports = (reportType, query, context) => {
    const logger = context.logger.start(`type:${reportType.code}`)
    const data = dataHelper(reportType, query, context)
    const config = data.config().sql
    const connection = data.connection()

    const db = mysql.db(connection, context)

    const where = whereClause(data, config, context)

    const clause = {
        procedure: config.procedure,
        select: config.select,
        count: config.count,
        from: config.from,
        where: where,
        group: config.group
    }

    let queryId = 0

    return {
        count: async () => {
            let log = logger.start('count')
            let count = await db.count(clause)
            log.end()
            return count
        },
        items: async (page) => {
            let log = logger.start('items')
            page = page || {}
            page.sort = page.sort || config.sort

            let rows = await db.find(clause, page)
            let items = (rows || []).map(i => data.toModel(i))
            log.end()
            return items
        },
        stats: async () => {
            let log = logger.start('stats')

            if (!config.summary) {
                return
            }

            let clause

            if (typeof config.summary === 'string') {
                clause = { sql: config.summary.inject(where) }
            } else {
                clause = {
                    select: config.summary.select,
                    from: config.summary.from,
                    where: where,
                    group: config.summary.group
                }
            }

            let rows = await db.find(clause)
            let items = (rows || []).map(i => data.toModel(i))
            log.end()
            return items
        },
        cancel: (id) => {
            return mysql.cancel(id || queryId)
        }
    }
}
