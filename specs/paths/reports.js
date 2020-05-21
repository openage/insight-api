module.exports = [{
    url: '/',
    get: { permissions: ['tenant.guest', 'tenant.user'] },
    post: { permissions: ['tenant.user'] }
}, {
    url: '/:id',
    get: { permissions: ['tenant.guest', 'tenant.user'] },
    put: { permissions: ['tenant.user'] },
    delete: { permissions: ['tenant.user'] }
}]
