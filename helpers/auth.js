'use strict';
const jwt = require('jsonwebtoken');
const db = require('../models');
const auth = require('config').get('auth');
const logger = require('@open-age/logger');
const bcrypt = require('bcrypt-nodejs');
const contextBuilder = require('./context-builder');

var extractToken = function (token, callback) {
    // contextBuilder.create({
    //     user: {
    //         isAdmin: true
    //     }
    // }).then(context => {
    //     callback(null, context);
    // }).catch(err => callback(err));

    jwt.verify(token, auth.secret, {
        ignoreExpiration: true
    }, function (err, claims) {
        if (err) {
            return callback(err);
        }

        contextBuilder.create(claims).then(context => {
            callback(null, context);
        }).catch(err => callback(err));
    });
};


const requiresAdmin = function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // TODO:
    // if (!token) {
    //     return res.accessDenied('token is required.');
    // }
    extractToken(token, function (err, context) {
        if (err) {
            return res.accessDenied('invalid token', 403, err);
        }

        if (!context.user) {
            return res.accessDenied('invalid user', 403);
        }

        if (!context.user.isAdmin) {
            return res.accessDenied('user is not admin', 403);
        }

        req.context = context;
        next();
    });
};

const requiresToken = function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    extractToken(token, function (err, context) {
        if (err) {
            return res.accessDenied('invalid token', 403, err);
        }

        if (!context.user) {
            return res.accessDenied('invalid user', 403);
        }
    
        req.context = context;
        next();
    });
};


const getToken = function (item) {
 
    let claims ={
        userId: item.id
    }
  
    return jwt.sign(claims, auth.secret, {
        expiresIn: auth.tokenPeriod || 1440
    });
};

const getHash = async(password, callback)=> {
    bcrypt.genSalt(10, function(err, salt) {
        if (err) {
            callback(err);
        }
        bcrypt.hash(password, salt, null, callback);
    });
};

const comparePassword = function(password1, password2, callback) {
    bcrypt.compare(password1, password2, callback);
};

exports.requiresAdmin = requiresAdmin;
exports.requiresToken = requiresToken;
exports.getToken = getToken;
exports.getHash = getHash;
exports.comparePassword = comparePassword;