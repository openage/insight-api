const pager = require('../helpers/paging')
const service = require('../services/reports')
const mapper = require('../mappers/reports')
const crud = require('./api-base')('reports')

exports.search = crud.search
exports.update = crud.update
exports.create = crud.create
exports.remove = crud.remove

exports.get = async (req) => {
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
        return crud.get(req)
    }
}

exports.data = async (req) => {
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

exports.generate = async (req) => {
    const report = await service.generate(req.id, req.context)
    return mapper.toModel(report)
}
