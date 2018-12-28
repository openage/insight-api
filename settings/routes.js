'use strict';

const fs = require('fs');
const apiRoutes = require('@open-age/express-api');
const auth = require('../helpers/auth');

const loggerConfig = require('config').get('logger');
var appRoot = require('app-root-path');
const fsConfig = require('config').get('folders');

const master = require('../api/master');

module.exports.configure = (app) => {

    app.get('/', (req, res) => {
        res.render('index', {
            title: 'Insight',
            message: 'This is Reports and Analytics Api'
        });
    });

    app.get('/api/logs', function (req, res) {
        var filePath = appRoot + '/' + loggerConfig.file.filename;
        res.download(filePath);
    });

    app.get('/api/reports/:file', function (req, res) {
        var fileName = req.params.file;
        let filePath = fsConfig.temp ? `${fsConfig.temp}/${fileName}` : `${appRoot}/temp/${fileName}`;
        res.download(filePath);
    });

    app.get('/api/merchants', master.getMerchant);
    app.get('/api/gateways', master.getPaymentGateways);
    app.get('/api/banks', master.getBanks);
    app.get('/api/cards', master.getCards);
    app.get('/api/status', master.getStatus);
    app.get('/api/paymentModes', master.getPaymentModes);
    app.get('/api/nbOptions', master.getNbOptions);
    app.get('/api/types', master.getTypes);
    app.get('/api/settlementStatus', master.getSettlementStatus);


    let api = apiRoutes(app);

    // api.model('reportRequests').register('REST', auth.requiresToken);
    api.model('reportRequests')
        .register([{
            action: 'POST',
            method: 'create',
            filter: auth.requiresToken
        }, {
            action: 'GET',
            method: 'recents',
            url: '/recents'
        }, {
            action: 'get',
            method: 'get',
            url: '/:id',
            filter: auth.requiresToken
        }, {
            action: 'GET',
            method: 'search',
            filter: auth.requiresToken
        }]);
    api.model('users')
        .register([{
                action: 'POST',
                method: 'create'
            }, {
                action: 'GET',
                method: 'search'
            },
            {
                action: 'PUT',
                method: 'update',
                url: '/:id'
            }, {
                action: 'POST',
                method: 'login',
                url: '/login'
            }
        ])
    api.model('favorites')
        .register([{
            action: 'POST',
            method: 'create',
            filter: auth.requiresToken
        }, {
            action: 'GET',
            method: 'search'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id'
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id'
        }])
};
