'use strict'
const db = require('../../models')

const appRoot = require('app-root-path')
const webConfig = require('config').get('webServer')
const queryConfig = require('config').get('query')
const fsConfig = require('config').get('folders')

const moment = require('moment')

const excel = require('../../helpers/xlsx-builder')

exports.subscribe = async (report, context) => {
    const log = context.logger.start(`process-${report.id}`)

    try {
        report.startedAt = new Date()
        const provider = require(`../../providers/${report.type.provider.handler}`)

        if (!provider) {
            log.error('provider not found')

            report.error = `either '${report.provider}' does not exist`
            report.status = 'errored'
            report.completedAt = new Date()
            return report.save()
        }

        log.debug('starting')

        report.status = 'in-progress'
        await report.save()

        log.debug('started the request')

        let count = await provider.count(report, context)
        log.debug(`${count} to fetch`)
        let offset = 0
        let limit = queryConfig.limit

        let sheetHeaderRows = provider.header(report, context)
        let headers = excel.buildHeaders(report.type.columns)

        let fileName = `${context.organization.code}-${report.type.code}-${moment().format('YY-MM-DD-HH-mm')}.xlsx`
        const file = excel.newWorkbook(fileName)
        var sheet = file.createSheet(report.type.config.sheet || report.type.code, headers.length + 5, count + sheetHeaderRows.length + 5)
        let currentRow = 0
        sheetHeaderRows.forEach(row => {
            currentRow = currentRow + 1
            excel.setRow(sheet, row, currentRow)
        })

        currentRow = excel.setHeader(sheet, currentRow + 1, headers)

        let data = await provider.fetch(report, offset, limit, context)
        for (const row of data) {
            currentRow = currentRow + 1
            for (const header of headers) {
                excel.setValue(sheet, currentRow, header, row)
            }
        }

        let result = await file.save()

        let filePath = fsConfig.temp ? `${fsConfig.temp}/${result.fileName}` : `${appRoot}/temp/${result.fileName}`

        log.debug('created the file')
        report.completedAt = new Date()
        report.status = 'ready'
        report.filePath = filePath
        report.fileUrl = `${webConfig.url}/reports/${result.fileName}`
        await report.save()
        log.info('generated')
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
