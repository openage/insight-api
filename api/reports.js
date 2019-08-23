const pager = require('../helpers/paging')
const service = require('../services/reports')
const mapper = require('../mappers/reports')
const api = require('./api-base')('reports')

const get = api.get

api.get = async (req) => {
    if (req.params.id === 'data') {
        let page = pager.extract(req)
        let pagedItems = await service.data(req.query.reportId, page, req.context)

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
    let pagedItems = await service.data(req.params.id, page, req.context)

    if (page) {
        pagedItems.skip = page.skip
        pagedItems.limit = page.limit
        pagedItems.pageSize = page.limit
        pagedItems.pageNo = page.pageNo
    }

    return pagedItems
}

api.generate = async (req) => {
    const report = await service.generate(req.id, req.context)
    return mapper.toModel(report, req.context)
}

module.exports = api
