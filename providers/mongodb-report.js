'use strict'

const mongo = require('../helpers/mongodb')

var dataHelper = require('../helpers/report-data')

const matchClause = (data, context) => {
    let log = context.logger.start('matchClause')

    var match = {}

    data.params().forEach(param => {
        let value = data.value(param)

        if (!value) {
            return
        }

        if (param.dbCondition === '<') {
            value = { '$lt': value }
        } else if (param.dbCondition === '<=') {
            value = { '$lte': value }
        } else if (param.dbCondition === '>') {
            value = { '$gt': value }
        } else if (param.dbCondition === '>=') {
            value = { '$gte': value }
        }

        if (param.isOr) {
            if (match['$or']) {
                if (match[param.dbKey]) {
                    match['$or'].push({ [param.dbKey]: { ...match[param.dbKey], ...value } })
                } else {
                    match['$or'].push({ [param.dbKey]: value })
                }
            } else {
                match['$or'] = []
                if (match[param.dbKey]) {
                    match['$or'].push({ [param.dbKey]: { ...match[param.dbKey], ...value } })
                } else {
                    match['$or'].push({ [param.dbKey]: value })
                }
            }
        } else {
            if (match[param.dbKey]) {
                match[param.dbKey] = { ...match[param.dbKey], ...value }
            } else {
                match[param.dbKey] = value
            }
        }
    })

    log.debug(match)

    return match
}

const projectClause = (reportType, context) => {
    let log = context.logger.start('projectClause')

    var project = { _id: 0 }

    reportType.type.columns.forEach(column => {
        project[column.key] = `${column.dbKey}`
        if (column.format) {
            if (column.format === 'object') {
                project[column.key] = JSON.parse(column.dbKey)
            }
        }
    })

    log.debug(project)

    return project
}

const whereBuilder = (match, aggregate) => {
    let where = [...(aggregate.lookups || [])]

    where.push({
        '$match': match
    })

    if (aggregate.group) {
        where.push({
            '$group': aggregate.group
        })
    }

    return where
}

const cancel = (id) => {
    // return sql.cancel(id)
}

module.exports = (reportType, query, context) => {
    const logger = context.logger.start(`type:${reportType.code}`)
    const data = dataHelper(reportType, query, context)
    const config = data.config()
    const connection = data.connection()

    const db = mongo.db(connection, context).collection(config.aggregate.collection)

    let match = matchClause(data, context)

    if (config.aggregate.match) {
        if (Object.entries(match).length === 0 && match.constructor === Object) {
            match = config.aggregate.match
        } else {
            match = { ...match, ...config.aggregate.match }
        }
    }

    let queryId = 0

    return {
        count: async () => {
            let log = logger.start('count')
            let where = whereBuilder(match, config.aggregate)
            let count = await db.count(where)
            log.end()
            return count
        },
        items: async (page) => {
            let log = logger.start('items')
            page = page || {}
            page.sort = page.sort || config.sort || config.aggregate.sort

            let where = whereBuilder(match, config.aggregate)

            const project = projectClause(reportType, context)

            if (project) {
                where.push({
                    '$project': project
                })
            }

            let rows = await db.find(where, page)
            let items = (rows || []).map(i => data.toModel(i))
            log.end()
            return items
        },
        stats: async () => {
            return {}
        },
        cancel: () => {
            return cancel(queryId)
        }
    }
}
