module.exports = [{
    url: '/',
    get: { permissions: ['tenant.user'] },
    post: { permissions: ['tenant.guest', 'tenant.user'] }
}, {
    url: '/:id',
    get: { permissions: ['tenant.user'] }
}]
