'use strict'
const fs = require('fs')
const changeCase = require('change-case')
const mappers = {}
const init = function () {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') !== -1 && file.indexOf('index.js') < 0) {
            var mapper = require('./' + file)

            var name = file.substring(0, file.indexOf('.js'))

            // use toModel as toSummary if one is not defined
            if (!mapper.toSummary) {
                mapper.toSummary = mapper.toModel
            }

            if (!mapper.toModels) {
                mapper.toModels = (entities) => {
                    return entities.map((entity) => {
                        return mapper.toSummary(entity)
                    })
                }
            }

            mappers[changeCase.camelCase(name)] = mapper
        }
    })
}

init()

module.exports = mappers
