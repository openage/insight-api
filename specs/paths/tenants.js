module.exports = [{
    url: '/:id',
    get: { permissions: ['tenant.admin'] },
    put: { permissions: ['tenant.admin'] }
}]
