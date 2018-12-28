"use strict";
var moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('reportRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.STRING
        },
        provider: DataTypes.STRING,      
        requestedAt: DataTypes.DATE,
        startedAt: DataTypes.DATE,
        completedAt: DataTypes.DATE,
        filePath: DataTypes.STRING,
        fileUrl: DataTypes.STRING,
        reportParams: DataTypes.STRING,
        error: DataTypes.STRING,
        status: {
            type: DataTypes.ENUM,
            values: ['new', 'in-progress', 'ready', 'cancelled', 'errored']
        }
    });
};