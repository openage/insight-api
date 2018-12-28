"use strict";
var bcrypt = require('bcrypt-nodejs');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    emailId: DataTypes.STRING,
    mobile: DataTypes.INTEGER,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    permission: DataTypes.STRING,
    token: DataTypes.STRING,
    createdAt: DataTypes.DATE
  });
};  