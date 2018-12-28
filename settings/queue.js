"use strict";
var logger = require('@open-age/logger')('queue');
var queue = require('@open-age/offline-processor');
var queueConfig = require('config').get('queueServer');
var _ = require('underscore');
var paramCase = require('param-case');
let db = require('../models');

module.exports.configure = function () {

    logger.info(`configuring queue`);

    queue.initialize({
        context: {
            serializer: function (context) {
                if (!context.organization) {
                    return Promise.error('context.organization is required');
                }

                context.organization = {
                    id: context.organization.id,
                    code: context.organization.code,
                };

                return Promise.resolve(context);
            },
            deserializer: function (context) {
                if (!context.organization) {
                    return Promise.error('context.organization is required');
                }

                if (context.organization.id) {
                    return db.organization.findOne({
                        _id: context.organization.id
                    }).then(item => {
                        context.organization = item;
                        return Promise.resolve(context);
                    });
                }

                if (context.organization.code) {
                    if(context.organization.code === 'all') {
                        return Promise.resolve(context);
                    }
                    return db.organization.findOne({
                        code: context.organization.code
                    }).then(item => {
                        context.organization = item;
                        return Promise.resolve(context);
                    });
                }

                return Promise.error('context.organization with id or code is required');
            },
            processors: function (context) {
                return db.alert.find({
                    organization: context.organization,
                    status: 'active'
                }).populate({
                    path: 'alertType',
                    match: {
                        'trigger.entity': paramCase(context.entity),
                        'trigger.action': paramCase(context.action)
                    }
                }).exec((err, alerts) => {
                    if (err) {
                        return Promise.error(err);
                    }
                    let items = [];

                    _.each(alerts, alert => {
                        if (alert.alertType && alert.alertType.processor && alert.alertType.processor.name) {
                            items.push({
                                name: alert.alertType.processor.name,
                                config: alert.config
                            });
                        }
                    });

                    return Promise.resolve(items);
                });
            }
        }
    });
};