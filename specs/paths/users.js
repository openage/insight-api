module.exports = [{
    url: '/:id',
    get: { permissions: ['tenant.user'] },
    put: { permissions: ['tenant.user'] }
}]
