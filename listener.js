'use strict';
global.Promise = require('bluebird');
const logger = require('@open-age/logger')('listener');
const redisConfig = require('config').get('queueServer');
require('./helpers/offline').initialize(redisConfig);
require('./settings/database').configure();
require('./helpers/offline').listen();
logger.info('listener processed');