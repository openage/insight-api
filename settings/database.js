'use strict';

const logger = require('@open-age/logger')('database');
const dbConfig = require('config').get('db');
global.Sequelize = require('sequelize');

module.exports.configure =  () => {
    const sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: dbConfig.dialect,
            logging: false,
        }
    );
    global.sequelize = sequelize;
    global.db = require('../models');

    sequelize.sync().then(() => {
       logger.info('db connected');
    }).catch(function(err) {
        logger.error(err);
        logger.info('DB Connection Failed');
    });
};

