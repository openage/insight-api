const pager = require('../helpers/paging')
const service = require('../services/report-types')
const api = require('./api-base')('reportTypes')

const get = api.get

api.get = async (req) => {
    if (req.params.id === 'data') {
        let page = pager.extract(req)
        let pagedItems = await service.data(req.query.reportTypeId || req.query.reportTypeCode, req.query, page, req.context)

        if (page) {
            pagedItems.skip = page.skip
            pagedItems.limit = page.limit
            pagedItems.pageSize = page.limit
            pagedItems.pageNo = page.pageNo
        }

        return pagedItems
    } else {
        return get(req)
    }
}

api.data = async (req) => {
    let page = pager.extract(req)
    let pagedItems = await service.data(req.params.id, req.query, page, req.context)

    if (page) {
        pagedItems.skip = page.skip
        pagedItems.limit = page.limit
        pagedItems.pageSize = page.limit
        pagedItems.pageNo = page.pageNo
    }

    return pagedItems
}

module.exports = api
