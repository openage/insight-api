"use strict";

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('favorites', {
        name: DataTypes.STRING,
    });
};
