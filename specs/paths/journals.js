module.exports = [{
    url: '/',
    get: { permissions: ['tenant.user'] },
    post: { permissions: ['tenant.user'] }
}, {
    url: '/:id',
    get: { permissions: ['tenant.user'] },
    put: { permissions: ['tenant.admin', 'organization.admin'] },
    delete: { permissions: ['tenant.admin', 'organization.admin'] }
}]
