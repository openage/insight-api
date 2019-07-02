'use strict'
const cron = require('cron').CronJob
const moment = require('moment')
const logger = require('@open-age/logger')
const merchantRecords = require('../services/fetch-data-count')

const start = (startOn) => {
    let job = new cron({
        cronTime: startOn,
        onTick: () => {
            merchantRecords.create()
        },
        start: true
    })
}

exports.schedule = () => {
    start(`05 30 23 * * *`)
}
