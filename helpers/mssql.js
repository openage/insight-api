'use strict'
var sql = require('mssql')

exports.updateFields = function (data) {
    var changedFields = []
    var index
    var field
    var newValue

    for (index in data.fields) {
        field = data.fields[index]

        newValue = data.newValues[field]
        if (data.modelObj[field] !== newValue) {
            changedFields.push(field)
            data.modelObj[field] = newValue
        }
    }

    return changedFields
}

/**
 * a SELECT clause builder
 * @param {String} tableName - the name of table to fetch FROM
 * @returns {Object}
 */

exports.selectBuilder = function (tableName) {
    var builder = {}

    var columns = []

    builder.add = function (param1, param2) {
        var column = {}
        if (arguments.length === 1) {
            column.name = param1
        } else {
            column.name = param2
            column.as = param1
        }
        columns.push(column)

        return builder
    }

    builder.build = function () {
        if (!columns.length) {
            return ' SELECT * FROM ' + tableName
        }

        var clause = ' SELECT '

        for (var i = 0; i < columns.length; i++) {
            clause = clause + columns[i].name + (columns[i].as ? ' AS ' + columns[i].as : '')

            if (i !== columns.length - 1) {
                clause = clause + ', '
            }
        }
        clause = clause + ' FROM ' + tableName + ' '
        return clause
    }

    return builder
}

/**
 * a LIMIT cause builder to be clubbed with SELECT
 * @param {Object} input - can be passed req.query
 * @param {Number} input.page - the page no to fetch (defaults to 1)
 * @param {Number} input.size - the no of records to fetch (defaults to 10)
 * @param {Boolean} input.noPaging - if paging needs to be skipped
 * @param {Object} defaults
 * @param {Object} defaults.no - to be used if input.page is missing
 * @param {Object} defaults.size - to be used if input.pageSize is missing
 * @returns {Number} no - the currentPage
 * @returns {Number} size - the no of records to fetch
 * @returns {Boolean} noPaging - if paging needs to be appied
 * @returns {function} build - to get the WHERE clause
 */
exports.pagingBuilder = function (input, defaults) {
    input = input || {}

    var builder = {
        no: input.page || (defaults && defaults.no ? defaults.no : 1),
        size: input.pageSize || (defaults && defaults.size ? defaults.size : 10)
    }

    if (input.noPaging === 'true' || input.noPaging === true) {
        builder.no = 1
        builder.size = 1000000
        builder.noPaging = true
    }

    builder.offset = (builder.no - 1) * builder.size
    /**
     * converts the count to no of pages
     * @param {Number} count
     * @returns {Number} - number of pages
     */
    builder.totalPages = function (count) {
        if (builder.noPaging) {
            return 1
        }
        return Math.ceil(count / builder.size)
    }

    /**
     * builds the LIMIT clause
     * @returns {String}
     */
    builder.build = function () {
        return builder.noPaging ? '' : ' LIMIT ' + builder.size + ' OFFSET ' + builder.offset + ' '
    }

    return builder
}

/**
 * a where cause builder that gives out where clause to be clubbed with select
 * @returns {function} add - method to add the AND condition
 * @returns {function} push -  method to add the AND condition
 * @returns {function} if - to conditionally ignore the subseqent add() or push()
 * @returns {function} build - to get the WHERE clause
 */
exports.whereBuilder = function () {
    var builder = {}

    builder.filters = []

    builder.push = function (obj) {
        if (obj.value) {
            builder.filters.push(obj)
        }
        return builder
    }

    /**
     * adds the condition to be added to WHERE clause
     * @param {String} field - the db column
     * @param {Any} value - the condtion is ignored if it is falsey
     * @param {String|Undefined} operation - defaults to '='
     * @returns {Object} the builder
     */
    builder.add = function (field, value, operater) {
        if (!value) {
            return builder
        }

        builder.filters.push({
            field: field,
            value: value,
            op: operater || '='
        })

        return builder
    }

    builder.concat = function (condition) {
        builder.filters.push(condition)
        return builder
    }

    /**
     * checks for condition
     * @param {function|Any} condtion - if falsey subseqent add or push methods are ignored
     * @returns {Object} the builder
     */
    builder.if = function (condition) {
        if (typeof (condition) === 'function' ? condition() : condition) {
            return builder
        }

        return {
            add: function () {
                return builder
            },
            push: function () {
                return builder
            }
        }
    }

    /**
     * builds and returns the WHERE clause
     * @returns {String} whereClause
     */
    builder.build = function (pre) {
        if (builder.filters.length === 0) {
            return pre ? ` WHERE ${pre} ` : ''
        }

        var clause = pre ? ` WHERE ${pre} AND ` : ' WHERE '

        for (var i = 0; i < builder.filters.length; i++) {
            if (builder.filters[i].op === 'like') {
                clause = clause + `${builder.filters[i].field} LIKE '%${builder.filters[i].value}%'`
            } else if (builder.filters[i].op === 'in') {
                clause = clause + `${builder.filters[i].field} IN (${builder.filters[i].value})`
            } else if (builder.filters[i].op === 'not in') {
                clause = clause + `${builder.filters[i].field} NOT IN (${builder.filters[i].value})`
            } else if (builder.filters[i].field) {
                clause = clause + `${builder.filters[i].field} ${builder.filters[i].op} '${builder.filters[i].value}'`
            } else {
                clause = clause + builder.filters[i]
            }

            if (i !== builder.filters.length - 1) {
                clause = clause + ' AND '
            }
        }
        return clause
    }

    return builder
}

const connections = {}

const getConnection = async (db, context) => {
    let poolKey = `${db.username}@${db.host}/${db.database}`
    context.logger.debug('getting connection', poolKey)

    let pool = connections[poolKey]

    if (!pool) {
        context.logger.debug('creating pool', poolKey)
        pool = new sql.ConnectionPool({
            server: db.host,
            user: db.username,
            password: db.password,
            database: db.database,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        })

        // connections[poolKey] = pool
    }

    return pool.connect()
}

/**
 * fetches data from the db
 * @param {String} dataQuery The query to run to get items
 * @param {Object} paging - used for paging to return page object (can pass pagingBuilder object)
 * @param {Number} paging.no
 * @param {Number} paging.size
 * @returns {Array} items
 * @returns {Number} totalPages
 * @returns {Number} currentPage
 */
exports.getData = async (db, dataQuery, context) => {
    context.logger.silly('dataQuery', dataQuery)
    let conn = await getConnection(db, context)
    let result = await conn.query(dataQuery)
    // conn.release()

    let items = result.recordsets[0] || []
    context.logger.debug(`got '${items.length}' records`)
    return items
}

exports.getProcedureData = async (db, dataQuery, context) => {
    dataQuery = dataQuery.replace(/\\/g, '')
    context.logger.silly('dataQuery', dataQuery)
    let conn = await getConnection(db, context)
    let result = await conn.execute(dataQuery)
    // conn.release()

    let items = result.recordsets[0] || []
    context.logger.debug(`got '${items.length}' records`)
    return items
}

exports.getCount = async (db, countQuery, context) => {
    context.logger.silly('countQuery', countQuery)

    let conn = await getConnection(db, context)
    let result = await conn.query(countQuery)
    // conn.release()
    return result.recordsets[0][0].count
}

exports.getProcedureCount = async (db, countQuery, context) => {
    countQuery = countQuery.replace(/\\/g, '')
    context.logger.silly('countQuery', countQuery)

    let conn = await getConnection(db, context)
    let result = await conn.execute(countQuery)
    // conn.release()
    return result.recordsets[0][0].count
}

exports.db = (connection, context) => {
    if (typeof connection === 'string') {
        connection = require('config').get(`providers.${connection}`).dbServer
    }
    return {
        count: async (clause) => {
            let queryString = ''

            if (clause.procedure) {
                queryString = `CALL ${clause.procedure.count}(${clause.where})`
                return this.getProcedureCount(connection, queryString, context)
            }

            if (clause.group) {
                queryString = `
                    SELECT count(*) as count FROM ( 
                        SELECT ${clause.count} as count
                        FROM ${clause.from} 
                        ${clause.where}
                        GROUP BY ${clause.group}
                    ) as count`
            } else {
                queryString = `
                    SELECT ${clause.count || 'count(*)'} as count
                    FROM ${sql.from} 
                    ${clause.where}`
            }

            return this.getCount(connection, queryString, context)
        },
        find: async (clause, page) => {
            page = page || {}

            if (clause.sql) {
                return this.getData(connection, clause.sql, context)
            }

            let queryString
            if (clause.procedure) {
                if (page.limit) {
                    if (clause.where) {
                        queryString = `call ${clause.procedure.fetch}(${page.limit},${page.offset || 0},${clause.where})`
                    } else {
                        queryString = `call ${clause.procedure.fetch}(${page.limit},${page.offset || 0})`
                    }
                } else {
                    queryString = `call ${clause.procedure.fetchAll}(${clause.where})`
                }

                return this.getProcedureData(connection, queryString, context)
            }

            let groupBy = clause.group ? `GROUP BY ${clause.group}` : ''

            queryString = ` 
              SELECT ${clause.select}
              FROM ${clause.from} 
              ${clause.where}
              ${groupBy}`
            if (page.sort) {
                if (page.offset >= 0 && page.limit) {
                    queryString = ` 
                      SELECT TOP ${page.limit} * FROM(
                      SELECT ${clause.select}, ROW_NUMBER() OVER(ORDER BY ${page.sort}) AS __i
                      FROM ${clause.from} 
                      ${clause.where}
                      ${groupBy}
                      ) __temp WHERE __i >= ${page.offset}; `
                } else {
                    queryString = ` 
                      SELECT ${clause.select}, ROW_NUMBER() OVER(ORDER BY ${page.sort}) AS __i
                      FROM ${clause.from} 
                      ${clause.where}
                      ${groupBy}`
                }
            } else if (page.offset >= 0 && page.limit) {
                queryString = ` 
                  SELECT TOP ${page.limit} * FROM(
                  SELECT ${clause.select}
                  FROM ${clause.from} 
                  ${clause.where}
                  ${groupBy}
                  ) __temp WHERE __i >= ${page.offset}; `
            }

            return this.getData(connection, queryString, context)
        }
    }
}
