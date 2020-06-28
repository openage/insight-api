module.exports = [{
    url: '/',

    get: { permissions: ['tenant.guest', 'tenant.user'] },
    post: { permissions: ['tenant.admin', 'organization.admin'] }
}, {
    url: '/:id',
    get: { permissions: ['tenant.guest', 'tenant.user'] },
    put: { permissions: ['tenant.admin', 'organization.admin'] },
    delete: { permissions: ['tenant.admin', 'organization.admin'] }
}, {
    url: '/:id/data',
    get: {
        permissions: ['tenant.guest', 'tenant.user'],
        method: 'data'
    }
}]
