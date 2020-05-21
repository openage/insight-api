'use strict'

const mongo = require('../helpers/mongodb')
var moment = require('moment')
var mongoose = require('mongoose')

const matchClause = (report, context) => {
    let log = context.logger.start('matchClause')

    var match = {}

    report.type.params.forEach(param => {
        let input = {}
        input = report.params.find(i => i.key === param.key)
        if (param.key === 'currentOrganization') {
            input = {
                // value: "59bd0f56415f0117c17d6df0"
                value: context.organization.code
            }
        }
        if (param.key === 'currentRoleCode') {
            input = {
                // value: "59bd0f56415f0117c17d6df0"
                value: context.user.role.code
            }
        }
        if (param.key === 'currentSupervisor') {
            input = {
                // value: "59bd0f56415f0117c17d6df0"
                value: context.user.role.code
            }
        }
        if (!input || !input.value) {
            return
        }

        let value = param.valueKey ? input.value[param.valueKey] : input.value

        if (!value) {
            return
        }

        if (Array.isArray(value)) {
            if (value.length > 1) {
                // const obj = (value.map(obj => obj)).toString()
                value = {
                    '$in': value
                }
            } else {
                let val = value[0].replace("'", '')
                value = val.replace("'", '')
            }
        }

        if (param.type === 'date') {
            value = moment(new Date(value)).startOf('day').toDate()
        }

        if (param.type === 'string' && param.regex) {
            value = {
                "$regex": `^${value}`,
                "$options": 'i'
            }
        }

        if (param.type === 'month') {
            value = {
                $gt: moment(new Date(value)).startOf('month').toDate(),
                $lt: moment(new Date(value)).endOf('month').toDate()
            }
        }

        if (param.type === 'object') {
            value = mongoose.Types.ObjectId(value)
        }

        if (param.type === 'integer') {
            value = parseInt(value)
        }

        if (param.dbCondition === '<') {
            value = { '$lt': value }
        } else if (param.dbCondition === '<=') {
            value = { '$lte': value }
        } else if (param.dbCondition === '>') {
            value = { '$gt': value }
        } else if (param.dbCondition === '>=') {
            value = { '$gte': value }
        } else {
            value = value
        }

        if (param.isOr) {
            if (match["$or"]) {
                if (match[param.dbKey]) {
                    match["$or"].push({ [param.dbKey]: { ...match[param.dbKey], ...value } })
                } else {
                    match["$or"].push({ [param.dbKey]: value })
                }
            } else {
                match["$or"] = []
                if (match[param.dbKey]) {
                    match["$or"].push({ [param.dbKey]: { ...match[param.dbKey], ...value } })
                } else {
                    match["$or"].push({ [param.dbKey]: value })
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

const projectClause = (report, context) => {
    let log = context.logger.start('projectClause')

    var project = { _id: 0 }

    report.type.columns.forEach(column => {
        project[column.key] = `${column.dbKey}`
        if (column.format) {
            if (column.format == 'object') {
                project[column.key] = JSON.parse(column.dbKey)
            }
        }
    })

    log.debug(project)

    return project
}

exports.count = async (report, context) => {
    let log = context.logger.start('providers/mongodb:count')

    var match = matchClause(report, context)

    let finder = [...JSON.parse(report.type.config.aggregate.lookups)]

    finder.push({
        '$match': match
    })

    if (report.type.config.aggregate.group) {
        finder.push({
            '$group': JSON.parse(report.type.config.aggregate.group)
        })
    }

    finder.push({
        '$count': 'total'
    })

    if (Object.entries(match).length === 0 && match.constructor === Object) {
        if (report.type.config.aggregate.match) {
            finder.forEach((item, i) => {
                if (item['$match']) {
                    finder[i]['$match'] = JSON.parse(report.type.config.aggregate.match)
                }
            })
        }
    } else {
        if (report.type.config.aggregate.match) {
            finder.forEach((item, i) => {
                if (item['$match']) {
                    finder[i]['$match'] = { ...finder[i]['$match'], ...JSON.parse(report.type.config.aggregate.match) }
                }
            })
        }
    }


    let rows = await mongo.aggregateArray(report.type.provider.config.db.host, report.type.provider.config.db.database, `${report.type.config.aggregate.collection}`, finder)

    if (rows.length > 0) {
        log.debug('counted:' + rows[0].total)
    } else {
        log.debug('counted')
    }

    if (rows.length > 0) {
        return rows[0].total
    }
    return 0
}

exports.fetch = async (report, offset, limit, context) => {
    let log = context.logger.start('providers/mongodb:fetch')

    var match = matchClause(report, context)
    var project = projectClause(report, context)

    let finder = [...JSON.parse(report.type.config.aggregate.lookups)]

    finder.push({
        '$match': match
    })

    if (report.type.config.aggregate.group) {
        finder.push({
            '$group': JSON.parse(report.type.config.aggregate.group)
        })
    }

    finder.push({
        '$project': project
    })

    if (report.type.config.aggregate.sort) {
        finder.push({
            '$sort': JSON.parse(report.type.config.aggregate.sort)
        })
    }

    if (Object.entries(match).length === 0 && match.constructor === Object) {
        if (report.type.config.aggregate.match) {
            finder.forEach((item, i) => {
                if (item['$match']) {
                    finder[i]['$match'] = JSON.parse(report.type.config.aggregate.match)
                }
            })
        }
    } else {
        if (report.type.config.aggregate.match) {
            finder.forEach((item, i) => {
                if (item['$match']) {
                    finder[i]['$match'] = { ...finder[i]['$match'], ...JSON.parse(report.type.config.aggregate.match) }
                }
            })
        }
    }

    if (limit) {
        if (offset === 0 || offset > 0) {
            finder.push({
                '$limit': limit + offset
            })
            finder.push({
                '$skip': offset
            })
        }
    }

    let rows = await mongo.aggregateArray(report.type.provider.config.db.host, report.type.provider.config.db.database, `${report.type.config.aggregate.collection}`, finder)

    log.debug('fetched')

    return rows

    // let finder = [{
    //     "$lookup":

    //     {

    //        "from": "employees",

    //        "localField": "employee",

    //        "foreignField": "_id",

    //        "as": "employees"

    //    }
    // },{
    //     "$match" : {
    //         "status": "present",
    //         "ofDate": new Date("2019-04-28 18:30:00.000Z"),
    //         "employees.department": "nursing general duty",
    //     }
    // },]

    // let rows = await mongo.aggregateArray(report.type.provider.config.db.host, report.type.provider.config.db.database, `${report.type.config.aggregate.collection}`, finder)

    // // log.debug('fetched')

    // return rows
}

exports.cancel = (id) => {
    return sql.cancel(id)
}
