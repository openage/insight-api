'use strict';
global.Promise = require('bluebird');

const express = require('express');
const logger = require('@open-age/logger')('app');
const serverConfig = require('config').get('webServer');
const redisConfig = require('config').get('queueServer');


const app = express();

require('./settings/database').configure();
require('./settings/express').configure(app);
require('./settings/routes').configure(app);
require('./helpers/offline').initialize(redisConfig);

logger.info('environment: ' + process.env.NODE_ENV);
logger.info('starting server');
app.listen(serverConfig.port, () => {
    logger.info('listening on port: '+ serverConfig.port);
})  

