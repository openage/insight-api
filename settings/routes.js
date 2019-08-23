'use strict'
const contextBuilder = require('../helpers/context-builder')
const apiRoutes = require('@open-age/express-api')
const fs = require('fs')
const appRoot = require('app-root-path')
const specs = require('../specs')
const fsConfig = require('config').get('folders')

module.exports.configure = (app, logger) => {
    logger.start('settings:routes:configure')

    let specsHandler = function (req, res) {
        fs.readFile('./public/specs.html', function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.contentType('text/html')
            res.send(data)
        })
    }

    app.get('/', specsHandler)

    app.get('/specs', specsHandler)

    app.get('/api/specs', function (req, res) {
        res.contentType('application/json')
        res.send(specs.get())
    })

    app.get('/reports/:file', function (req, res) {
        var fileName = req.params.file
        let filePath = fsConfig.temp ? `${fsConfig.temp}/${fileName}` : `${appRoot}/temp/${fileName}`
        res.download(filePath)
    })

    var api = apiRoutes(app, { context: { builder: contextBuilder.create } })
    api.model('logs').register('REST', { permissions: 'tenant.user' })

    api.model('reports').register('REST', { permissions: 'tenant.user' })
    api.model('reportTypes').register('REST', { permissions: 'tenant.user' })

    api.model('reportAreas').register('REST', { permissions: 'tenant.user' })
    api.model('providers').register('REST', { permissions: 'tenant.user' })
    api.model('journals').register('REST', { permissions: 'tenant.user' })

    logger.end()
}
