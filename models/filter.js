"use strict";
var moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('filter', {      
        mode: DataTypes.STRING,
        status: DataTypes.STRING,
        type: DataTypes.STRING,   
        cards: DataTypes.STRING,     
        settlementStatus: DataTypes.STRING       
    });
};