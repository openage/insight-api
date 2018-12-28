'use strict';
const logger = require('@open-age/logger');
var db = require('../models');

const setContext = (context) => {
    context.logger = logger('context');
    context.where = () => {
        let clause = {};
        let filters = {};

        filters.add = (field, value) => {
            clause[field] = value;
            return filters;
        };

        filters.clause = clause;

        return filters;
    };

    return context;
};

exports.create = async(claims) => {

    let user = null;
    if (claims.user) {
        user = claims.user;
    } else if (!claims.userId) {
        user = null;
    } else {
        user = await db.user.find({where:{
            id: claims.userId
        }});
    }

    return Promise.resolve(setContext({
        user: user
    }));
};

exports.serialize = (context) => {
    let serialized = {};

    // TODO:
    // if (context.user) {
    //     serialized.userId = context.user.id;
    // }

    serialized.user = context.user;
    

    return Promise.resolve(serialized);
};