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

exports.header = (report, context) => {
    let headers = []

    let reportType = report.type

    let header = reportType.header || {}
    if (header.title) {
        let titleText = header.title.text || report.type.name

        if (header.title.format === 'upper') {
            titleText = titleText.toUpperCase()
        }

        headers.push({
            col: header.title.column || 1,
            to: report.type.columns.length,
            text: titleText,
            style: header.title.style
        })
    }

    if (header.organization) {
        let orgText = header.organization.text || context.organization.code

        if (header.organization.format === 'upper') {
            orgText = orgText.toUpperCase()
        }
        headers.push({
            col: header.organization.column || 1,
            to: report.type.columns.length,
            text: orgText,
            style: header.organization.style
        })
    }

    if (header.date || header.creator) {
        let contextRow = []
        if (header.date) {
            let dateText = `${header.date.label || 'Date:'} ${moment().format(header.date.format || 'DD-MM-YYYY')}`
            contextRow.push({
                col: header.date.column || 1,
                text: dateText,
                style: header.date.style
            })
        }

        if (header.creator) {
            let creatorText = `${header.creator.label || 'By:'} ${context.user.profile.name}`

            if (header.creator.format === 'upper') {
                creatorText = creatorText.toUpperCase()
            }

            contextRow.push({
                col: header.creator.column || report.type.columns.length,
                text: creatorText,
                style: header.creator.style
            })
        }

        headers.push(contextRow)
    }

    if (header.params) {
        let col = header.params.column || 1
        let style = header.params.style || {}
        headers.push({
            col: col,
            text: header.creator.label || 'Filters',
            style: style
        })
        report.params.forEach(param => {
            headers.push([{
                col: col,
                text: param.label,
                style: style
            }, {
                col: col + 1,
                text: param.valueLabel,
                style: style.value || {}
            }])
        })
    }

    return headers
}

exports.fetch = async (report, offset, limit, context) => {
    let log = context.logger.start('providers/mssql-report:fetch')
    let groupBy = report.type.config.sql.group ? `GROUP BY ${report.type.config.sql.group}` : ''

    let queryString = ` 
    SELECT TOP ${limit} * FROM(
    SELECT ${report.type.config.sql.select}, ROW_NUMBER() OVER(ORDER BY ${report.type.config.sql.sort}) AS __i
    FROM ${report.type.config.sql.from} 
    ${whereClause(report, context)}
    ${groupBy}
    ) __temp WHERE __i >= ${offset}; `

    let items = await sql.getData(report.type.provider.config.db, queryString, context)

    log.debug('fetched')
    return items.map(function (item) {
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
                    item[column.key] = moment(value).format(column.format || 'h:mm:ss a')
                }
            }
        })
        return item
    })
}
exports.cancel = (id) => {
    return sql.cancel(id)
}
