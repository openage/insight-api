const pager = require('../helpers/paging')
const service = require('../services/report-types')
const crud = require('./api-base')('reportTypes')

exports.get = crud.get
exports.search = crud.search
exports.update = crud.update
exports.create = crud.create
exports.remove = crud.remove

exports.data = async (req) => {
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
