module.exports = [{
    url: '/',
    get: { permissions: ['tenant.user'] },
    post: { permissions: ['guest', 'user'] }
}, {
    url: '/:id',
    get: { permissions: ['tenant.user'] }
}]
