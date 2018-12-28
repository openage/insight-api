"use strict";
const db = require('../../../models');
const logger = require('@open-age/logger')('report-request');
const csvProcessor = require('json2csv');
const appRoot = require('app-root-path');
var fs = require('fs');
const webConfig = require('config').get('webServer');
const queryConfig = require('config').get('query');
const fsConfig = require('config').get('folders');




const appendToFile = (filePath, fields, rows) => {
    return new Promise((resolve, reject) => {
        csvProcessor({
            header: false,
            fields: fields,
            data: rows
        }, function (err, csv) {
            fs.appendFile(filePath, csv, (err) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve();
                }
            });
        });
    });
};

const createFile = (filePath, fields) => {
    return new Promise((resolve, reject) => {
        csvProcessor({
            fields: fields,
            data: []
        }, function (err, csv) {
            fs.writeFile(filePath, csv, (err) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve();
                }
            });
        });
    });
};

const fetch = (generator, reportParams, count, offset, limit, fields, filePath) => {
    return generator.fetch(reportParams, offset, limit).then(rows => {
        return appendToFile(filePath, fields, rows).then(() => {
            offset = offset + limit;

            if (offset > count) {
                return Promise.resolve();
            }
            return fetch(generator, reportParams, count, offset, limit, fields, filePath);
        });
    });
};

// the default processing would be done here
exports.process = function (data, context, cb) {
    const log = logger.start(`process-${data.id}`);
    return db.reportRequest
        .findOne({
            where: {
                id: data.id,
                status: 'new'
            },
            include: [{
                all: true
            }]
        })
        .then(reportRequest => {
            if (!reportRequest) {
                log.debug(`no 'new' request found with id: ${data.id}`);
                return cb(null);
            }
            log.debug('got the request', reportRequest.id);

            reportRequest.startedAt = new Date();
            const provider = require(`../../../providers/${reportRequest.provider}/reports`);
            const generator = provider ? provider[reportRequest.type] : null;

            if (!provider || !generator) {
                if (!provider) {
                    log.error('provider not found');
                } else if (!generator) {
                    log.error('generator not found');
                }

                reportRequest.error = `either '${reportRequest.provider}' does not exist or it does not support report '${reportRequest.type}'`;
                reportRequest.status = 'errored';
                reportRequest.completedAt = new Date();
                return reportRequest.save().then(() => cb()).catch(cb);
            }

            reportRequest.status = 'in-progress';
            let reportParams = JSON.parse(reportRequest.reportParams);

            log.debug('starting', reportParams);

            return reportRequest.save().then(() => {
                log.debug('started the request');



                return generator.count(reportParams).then(count => {
                    log.debug(`${count} to fetch`);

                    let offset = 0;
                    let limit = queryConfig.limit;

                    let fields = generator.fields();

                    let fileName;
                    if (reportParams.merchants) {
                        fileName = `${reportRequest.provider}-${reportRequest.type}-${reportParams.merchants.join()}-${reportRequest.id}.csv`;
                    } else {
                        fileName = `${reportRequest.provider}-${reportRequest.type}-${reportRequest.id}.csv`;
                    }
                    let filePath = fsConfig.temp ? `${fsConfig.temp}/${fileName}` : `${appRoot}/temp/${fileName}`;

                    createFile(fileName, fields);

                    return fetch(generator, reportParams, count, offset, limit, fields, filePath).then(() => {
                        log.debug('created the file');
                        reportRequest.status = 'ready';
                        reportRequest.filePath = filePath;
                        reportRequest.fileUrl = `${webConfig.url}/reports/${fileName}`;

                        return reportRequest.save().then(() => {
                            log.debug('done');
                            cb(null);
                        });
                    }).catch(err => {

                        log.error('got err while fetching', err);
                        reportRequest.error = err.toString();
                        reportRequest.status = 'errored';

                        return reportRequest.save().then(() => {
                            log.debug('done');
                            cb(null);
                        });
                    });
                });
            });
        }).catch(err => {
            log.error(err);
            cb(err);
        });
};