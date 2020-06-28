module.exports = [{
    url: '/',
    get: { permissions: ['tenant.user'] },
    post: { permissions: ['tenant.user'] }
}, {
    url: '/:id',
    put: { permissions: ['organization.admin', 'tenant.admin'] },
    delete: { permissions: ['organization.admin', 'tenant.admin'] },
    get: { permissions: ['organization.user', 'tenant.admin'] }
}]
