'use strict';
const entities = require('../models').reportRequest;
const db = require('../models');
const mapper = require('../mappers').reportRequest;
const service = require('../services/report-requests');
const async = require('async');

exports.create = function(req, res) {
    service.create(req.body, req.context).then(entity => {
        res.data(mapper.toModel(entity));
    }).catch(error => res.failure(error));
};

exports.get = function(req, res) {
    entities.findOne({
        where: {
            id: req.params.id
        },
        include: [{
            all: true
        }]
    }).then(entity => {
        res.data(mapper.toModel(entity));
    }).catch(error => res.failure(error));
};

// exports.update = function (req, res) {
//     service.update(req.params.id, req.body, req.context).then(provider => {
//         res.data(mapper.toModel(provider));
//     }).catch(error => res.failure(error));
// };

exports.search = function(req, res) {
    let query = {};
    let paging = {};
    paging.pageNo = 1;
    paging.pageSize = 10;
    if (req.query.PageNo) {
        paging.pageNo = Number(req.query.PageNo);
    }
    if (req.query.pageSize) {
        paging.pageSize = Number(req.query.pageSize);
    }
    paging.pageOffSet = paging.pageNo * paging.pageSize - paging.pageSize;
    query.userId = req.context.user.id;
    query.type = req.query.type;

    async.waterfall([
            (cb) => {
                entities.findAndCountAll({
                        where: query,
                        include: [{
                            all: true
                        }],
                        order: [
                            ['id', 'DESC']
                        ],
                        offset: paging.pageOffSet,
                        limit: paging.pageSize
                    })
                    .then((reports) => {
                        cb(null, reports.rows, reports.count);
                    });
            },
            (reports, reportsCount, cb) => {
                async.eachSeries(reports, (report, next) => {
                    db.favorites.find({
                        where: {
                            reportRequestId: report.id
                        },
                    }).then((favorites) => {
                        if (!favorites) {
                            report.isFavorite = false;
                        } else {
                            report.isFavorite = true;
                        }
                        next();
                    });

                }, (err) => {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, reports, reportsCount);
                });
            }
        ],
        (err, reports, reportsCount) => {
            if (err) {
                return res.failure(err);
            }
            // return res.page(mapper.toModels(reports));
            return res.json({
                isSuccess: true,
                pageNo: paging.pageNo || 1,
                pageSize: paging.pageSize || 10,
                items: mapper.toModels(reports),
                total: reportsCount
            });
        })
};

exports.recents = function(req, res) {
    let query = {};
    entities.findAll({
        where: query,
        limit: 10,
        include: [{
            all: true
        }],
        order: [
            ['id', 'DESC']
        ]
    }).then(reports => {
        res.page(mapper.toModels(reports));
    }).catch(error => res.failure(error));
};