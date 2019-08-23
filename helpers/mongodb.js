'use strict'
var mongo = require('mongodb')

const getConnection = (host) => {
    return new Promise((resolve, reject) => {
        mongo.MongoClient.connect(host, function (err, connection) {
            if (err) { return reject(err) }
            resolve(connection)
        })
    })
}

const aggregateArray = (host, database, collection, finder) => {
    return getConnection(host).then(connection => {
        return new Promise((resolve, reject) => {
            return connection.db(database).collection(collection).aggregate(finder,{allowDiskUse: true, collation:{"locale" : "en", numericOrdering: true}}).toArray((err, rows) => {
                connection.close()
                if (err) {
                    return reject(err)
                }
                return resolve(rows)
            })
        })
    })
}
exports.aggregateArray = aggregateArray

// var db = require()
// db('directory).collection('employees').aggregate([]).then(list=> {
// })
exports.db = (provider) => {
    var dbConfig = require('config').get(`providers.${provider}`).dbServer
    return {
        collection: (name) => {
            return {
                aggregate: (finder) => {
                    return aggregateArray(dbConfig.host, dbConfig.database, name, finder)
                }
            }
        }
    }
}

// exports.whereBuilder = function (){
//     var builder = {}

//     builder.filters = []

//     builder.push = function (obj) {
//         if (obj.value) {
//             builder.filters.push(obj)
//         }
//         return builder
//     }

//     /**
//      * adds the condition to be added to WHERE clause
//      * @param {String} field - the db column
//      * @param {Any} value - the condtion is ignored if it is falsey
//      * @param {String|Undefined} operation - defaults to '='
//      * @returns {Object} the builder
//      */
//     builder.add = function (field, value, operater) {
//         if (!value) {
//             return builder
//         }

//         let dbValue

//         if(operater === 'lt'){
//             dbValue = `{ $lt: value }`
//         }else if(operater === 'lte'){
//             dbValue = `{ $lte: value }`
//         }else if(operater === 'gt'){
//             dbValue = `{ $gt: value }`
//         }else if(operater === 'gte'){
//             dbValue = `{ $gte: value }`
//         }else {
//             dbValue = value
//         }

//         builder.filters.push({
//             field: field,
//             value: dbValue,
//         })

//         return builder
//     }

//     // builder.concat = function (condition) {
//     //     builder.filters.push(condition)
//     //     return builder
//     // }

//     /**
//      * checks for condition
//      * @param {function|Any} condtion - if falsey subseqent add or push methods are ignored
//      * @returns {Object} the builder
//      */
//     builder.if = function (condition) {
//         if (typeof (condition) === 'function' ? condition() : condition) {
//             return builder
//         }

//         return {
//             add: function () {
//                 return builder
//             },
//             push: function () {
//                 return builder
//             }
//         }
//     }

//     /**
//      * builds and returns the WHERE clause
//      * @returns {String} whereClause
//      */
//     builder.build = function () {
//         if (builder.filters.length === 0) {
//         }

//         var clause = `{ $match : { `
//         var clause = {
//             '$match': {}
//         }

//         for (var i = 0; i < builder.filters.length; i++) {
//             clause[`${this.builer.filters[i].field}`] = 
//                 clause = clause + `${this.builer.filters[i].field}: ${this.builer.filters[i].value}, `
//         }
//         clause = clause + '} },'
//         return clause
//     }

//     return builder
// }
