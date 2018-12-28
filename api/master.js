'use strict';

const masterData = require('../providers/master-data');

exports.getMerchant = function (req, res) {
    masterData.getMerchant(req.query).then(items => res.json({
        isSuccess: true,
        items: items
    })).catch(err => res.json(err));
};

exports.getPaymentGateways = function (req, res) {
    masterData.getPaymentGateways().then(items => res.json({
        isSuccess: true,
        items: items
    })).catch(err => res.json(err));
};
exports.getPaymentModes = function (req, res) {
    masterData.getModes()
        .then(items => res.json({
            isSuccess: true,
            items: items
        })).catch(err => res.json(err));
};

exports.getBanks = (req, res) => {
    masterData.getBanks()
        .then((items) => {
            res.json({
                isSuccess: true,
                items: items
            })
        }).catch(err => res.json(err))
}

exports.getNbOptions = (req, res) => {
    masterData.getNbOptions()
        .then((items) => {
            res.json({
                isSuccess: true,
                items: items
            })
        }).catch(err => res.json(err))
}

exports.getCards = (req, res) => {
    masterData.getCards()
        .then((items) => {
            res.json({
                isSuccess: true,
                items: items
            })
        }).catch(err => res.json(err))
}

exports.getStatus = (req, res) => {
    masterData.getStatus()
        .then((items) => {
            res.json({
                isSuccess: true,
                items: items
            })
        }).catch(err => res.json(err))
}

exports.getTypes = (req, res) => {
    masterData.getTypes()
        .then((items) => {
            res.json({
                isSuccess: true,
                items: items
            })
        }).catch(err => res.json(err))
}

exports.getSettlementStatus = (req, res) => {
    masterData.getSettlementStatus()
        .then((items) => {
            res.json({
                isSuccess: true,
                items: items
            })
        }).catch(err => res.json(err))
}
