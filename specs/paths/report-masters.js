module.exports = [{
    url: '/',
    get: { permissions: ['tenant.user'] },
    post: { permissions: ['tenant.admin'] }
}, {
    url: '/:id',
    get: { permissions: ['tenant.user'] },
    put: { permissions: ['tenant.admin'] },
    delete: { permissions: ['tenant.admin'] }
}]
