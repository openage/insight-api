'use strict'
const db = require('../../models')

const appRoot = require('app-root-path')
const webConfig = require('config').get('webServer')
const queryConfig = require('config').get('query')
const fsConfig = require('config').get('folders')

const dataFormatter = require('../../mappers/reportColumns').formatResult

const moment = require('moment')

const getReportHeaderRows = (report, context) => {
    let headers = []

    let reportType = report.type

    let header = reportType.header || {}
    if (header.title) {
        let titleText = header.title.text || reportType.name

        if (header.title.format === 'upper') {
            titleText = titleText.toUpperCase()
        }

        headers.push({
            col: header.title.column || 1,
            to: report.type.columns.length,
            text: titleText,
            style: header.title.style
        })
    }

    if (header.organization) {
        let orgText = header.organization.text || context.organization.code

        if (header.organization.format === 'upper') {
            orgText = orgText.toUpperCase()
        }
        headers.push({
            col: header.organization.column || 1,
            to: report.type.columns.length,
            text: orgText,
            style: header.organization.style
        })
    }

    if (header.date || header.creator) {
        let contextRow = []
        if (header.date) {
            let dateText = `${header.date.label || 'Date:'} ${moment().format(header.date.format || 'DD-MM-YYYY')}`
            contextRow.push({
                col: header.date.column || 1,
                text: dateText,
                style: header.date.style
            })
        }

        if (header.creator) {
            let creatorText = `${header.creator.label || 'By:'} ${context.user.profile.firstName || ''} ${context.user.profile.lastName || ''}`

            if (header.creator.format === 'upper') {
                creatorText = creatorText.toUpperCase()
            }

            contextRow.push({
                col: header.creator.column || report.type.columns.length,
                text: creatorText,
                style: header.creator.style
            })
        }

        headers.push(contextRow)
    }

    if (header.params) {
        let col = header.params.column || 1
        let style = header.params.style || {}
        headers.push({
            col: col,
            text: header.creator.label || 'Filters',
            style: style
        })
        report.params.forEach(param => {
            headers.push([{
                col: col,
                text: param.label,
                style: style
            }, {
                col: col + 1,
                text: param.valueLabel,
                style: style.value || {}
            }])
        })
    }

    return headers
}

const formatResult = (item, report, context) => {
    report.type.columns.forEach(column => {
        if (column.type === 'date') {
            let value = item[column.key]
            if (value) {
                item[column.key] = moment(value).format(column.format || 'DD-MM-YYYY')
            }
        }

        if (column.type === 'time') {
            let value = item[column.key]
            if (value) {
                item[column.key] = moment(value).format(column.format || 'h:mm:ss a')
            }
        }
    })
    return item
}

exports.subscribe = async (report, context) => {
    const log = context.logger.start(`process-${report.id}`)

    try {
        report.startedAt = new Date()

        const type = report.type
        const handler = require(`../../providers/${type.type.provider.handler}`)

        if (!handler) {
            log.error('provider not found')

            report.error = `either 'providers/${type.type.provider.handler}' does not exist`
            report.status = 'errored'
            report.completedAt = new Date()
            return report.save()
        }

        log.silly('starting')

        report.status = 'in-progress'
        await report.save()

        log.silly('started the request')

        const provider = handler(type, report.params, context)

        let count = await provider.count()

        log.silly(`${count} records found`)
        log.silly('fetching data')
        let data = await provider.items({
            offset: 0,
            limit: queryConfig.limit
        })

        let stats
        if (provider.footer) {
            stats = await provider.footer()
        }

        // build report

        let format = report.type.config.format || report.type.config.type || 'excel'

        if (format === 'xlsx' || format === 'xls') {
            format = 'excel'
        } else if (format === 'word' || format === 'msword') {
            format = 'pdf'
        }
        if (format !== 'excel' && format !== 'pdf') {
            format = 'excel'
        }

        const reportBuilder = require(`../../helpers/${format}-builder`)

        let reportFile = await reportBuilder.file(type, count, context)

        reportFile.setHeader(report)

        for (const row of data) {
            reportFile.setRow(dataFormatter(row, type, context))
        }
        if (stats) {
            reportFile.setRow(formatResult(stats, report, context))
        }
        let result = await reportFile.build()

        log.silly('ready for download')
        report.completedAt = new Date()
        report.status = 'ready'
        report.filePath = result.path
        report.fileUrl = `${webConfig.url}/reports/${result.name}`
        await report.save()
        log.info(`generated: ${report.fileUrl}`)
    } catch (err) {
        log.error(err)
        report.completedAt = new Date()
        log.error('got err while fetching', err)
        if (!report.status === 'aborted') {
            report.error = err.toString()
            report.status = 'errored'
        }
        await report.save()
    }
}

exports.onError = async (data, context) => {
    const log = context.logger.start(`process-${data.id}`)
    const reportRequest = await db.reportRequests.findById(data.id)
    if (!reportRequest) {
        log.debug(`no 'in-progress' request found with id: ${data.id}`)
        return
    }
    log.debug('got the request', reportRequest.id)

    reportRequest.error = data.error
    reportRequest.status = 'errored'
    reportRequest.completedAt = new Date()
    await reportRequest.save()

    log.end()
}
