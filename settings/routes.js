'use strict'
const auth = require('../helpers/auth')
const apiRoutes = require('@open-age/express-api')
const fs = require('fs')
const appRoot = require('app-root-path')
const specs = require('../specs')
const fsConfig = require('config').get('folders')

module.exports.configure = (app, logger) => {
    logger.start('settings:routes:configure')
    app.get('/', (req, res) => {
        res.render('index', {
            title: 'Reports Api',
            message: 'This is Reports Api'
        })
    })
    app.get('/specs', function (req, res) {
        fs.readFile('./public/specs.html', function (err, data) {
            res.contentType('text/html')
            res.send(data)
        })
    })
    app.get('/api/specs', function (req, res) {
        res.contentType('application/json')
        res.send(specs.get())
    })

    app.get('/api/versions/current', function (req, res) {
        var filePath = appRoot + '/version.json'

        fs.readFile(filePath, function (err, data) {
            res.contentType('application/json')
            res.send(data)
        })
    })

    app.get('/reports/:file', function (req, res) {
        var fileName = req.params.file
        let filePath = fsConfig.temp ? `${fsConfig.temp}/${fileName}` : `${appRoot}/temp/${fileName}`
        res.download(filePath)
    })
    var api = apiRoutes(app)
    api.model('logs')
        .register('REST', [auth.requireRoleKey])

    api.model('reports')
        .register('REST', [auth.requireRoleKey])
        .register([{
            action: 'GET',
            method: 'data',
            url: '/:id/data',
            filter: [auth.requireRoleKey]
        }])

    api.model('reportTypes')
        .register('REST', [auth.requireRoleKey])
        .register([{
            action: 'GET',
            method: 'data',
            url: '/:id/data',
            filter: [auth.requireRoleKey]
        }])
    api.model('reportAreas').register('REST', [auth.requireRoleKey])
    api.model('providers').register('REST', [auth.requireRoleKey])
    logger.end()
}
