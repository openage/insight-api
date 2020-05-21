'use strict'

const fs = require('fs')
const changeCase = require('change-case')
const definitions = require('../definitions')
const multipart = require('connect-multiparty')

const getDefaultMethod = (httpAction, url) => {
    switch (httpAction.toLowerCase()) {
        case 'get':
            if (!url || url === '/') {
                return 'search'
            } else if (url === '/:id' || url === '/:code') {
                return 'get'
            }
            break
        case 'post':
            if (!url || url === '/') {
                return 'create'
            } else if (url === '/bulk') {
                return 'bulk'
            }
            break
        case 'put':
            if (url === '/:id' || url === '/:code') {
                return 'update'
            }

            break

        case 'delete':
            if (url === '/:id' || url === '/:code') {
                return 'delete'
            }
            break
    }

    throw new Error(`method missing: ${httpAction}:${url}`)
}

const getRoutes = (items) => {
    let routes = []
    for (const item of items) {
        let url = item.url

        if (url) {
            url = url.split('?')[0]
        }

        if (!url || url === '/') {
            url = undefined
        } else if (!(url.startsWith('/') || url.startsWith('.'))) {
            url = `/${url}`
        }

        for (const type of ['get', 'post', 'put', 'delete']) {
            let action = item[type]
            if (!action) {
                continue
            }

            if (!action.method) {
                action.method = getDefaultMethod(type, url)
            }

            let filters = []

            if (action.consumes && action.consumes.find(a => a === 'multipart/form-data')) {
                filters.push(multipart())
            }
            if (action.filter) {
                if (Array.isArray(action.filter)) {
                    action.filter.forEach(f => filters.push(f))
                } else {
                    filters.push(action.filter)
                }
            }

            if (item.filter) {
                if (Array.isArray(item.filter)) {
                    item.filter.forEach(f => filters.push(f))
                } else {
                    filters.push(item.filter)
                }
            }
            routes.push({
                action: type.toUpperCase(),
                url: url,
                method: action.method,
                permissions: action.permissions || item.permissions || [],
                filter: filters
            })
        }
    }

    return routes
}

const setHeaders = (param) => {
    if (!param.name || !param.name.startsWith('x-')) {
        return param
    }

    if (param.required === undefined) {
        param.required = true
    }
    param.in = param.in || 'header'

    switch (param.name) {
        case 'x-role-key':
            param.description = param.description || 'user role key'
            break
        case 'x-tenant-code':
            param.description = param.description || 'the application code'
            break
        case 'x-organization-code':
            param.description = param.description || 'the organization code'
            break
    }

    return param
}

const setPermissions = (params, permissions) => {
    if (!permissions || !permissions.length) {
        return params
    }
    let isGuest = false
    if (permissions.find(p => p.toLowerCase() === 'tenant.guest')) {
        params.push({
            name: 'x-tenant-code',
            in: 'header',
            type: 'string',
            required: true,
            description: 'application code'
        })
        isGuest = true
    }
    if (permissions.find(p => p.toLowerCase() === 'organization.guest')) {
        params.push({
            name: 'x-organization-code',
            in: 'header',
            type: 'string',
            required: true,
            description: 'organization code'
        })
        isGuest = true
    }

    if (!isGuest) {
        params.push({
            name: 'x-role-key',
            in: 'header',
            type: 'string',
            required: true,
            description: 'user role key'
        })
    }

    return params
}

const setBody = (param, options, operation) => {
    param.type = param.type || 'object'
    if (param.required === undefined) {
        param.required = true
    }
    if (typeof param.schema === 'string') {
        if (definitions[param.schema]) {
            param.schema = {
                $ref: `#/definitions/${param.schema}`
            }
        }
    } else if (!param.schema) {
        let definition
        if (operation === 'create' && definitions[`${options.name}CreateReq`]) {
            definition = `#/definitions/${options.name}CreateReq`
        } else if (operation === 'update' && definitions[`${options.name}UpdateReq`]) {
            definition = `#/definitions/${options.name}UpdateReq`
        } else {
            definition = `#/definitions/${options.name}Req`
        }
        param.schema = {
            $ref: definition
        }
    }

    return param
}

const parseAction = (action, options) => {
    action.consumes = action.consumes || [
        'application/json'
    ]
    action.produces = action.produces || [
        'application/json'
    ]

    action.parameters = action.parameters || []
    action.responses = action.responses || {}

    let summary = ''
    let description = ''
    let operationId = ''
    let defaultResponse = {
        schema: {
            $ref: `#/definitions/${options.name}Res`
        }
    }

    let addBody = false

    switch (options.type) {
        case 'post':
            addBody = true
            if (options.url === '.csv') {
                summary = 'import'
                description = `imports all the items in the posted CSV file`
                operationId = `${options.name}-import`
            } else if (options.url === '/') {
                summary = `create`
                description = `creates new item in ${options.name}`
                operationId = `${options.name}-create`
            }
            break
        case 'put':
            addBody = true
            if (options.url === '/:id' || options.url === '/:code') {
                summary = `update`
                description = `updates an item in ${options.name}`
                operationId = `${options.name}-update`
            }
            break
        case 'delete':
            summary = `remove`
            description = `removes an item in ${options.name}`
            operationId = 'delete'
            break
        case 'get':
            if (!options.url || options.url === '' || options.url === '/') {
                summary = `search`
                description = `searches in ${options.name}`
                operationId = `${options.name}-search`
                defaultResponse.schema.$ref = `#/definitions/${options.name}PageRes`
            } else if (options.url === '.csv') {
                summary = `export`
                description = `exports all the items as ${options.name}.csv`
                operationId = `${options.name}-export`
            } else if (options.url === '/:id') {
                summary = `get`
                description = `gets an item by id in ${options.name}`
                operationId = `${options.name}-get-by-id`
            } else if (options.url === '/:code') {
                summary = `get`
                description = `gets an item by code in ${options.name}`
                operationId = `${options.name}-get-by-code`
            } else {
                summary = `get`
                description = `gets an item in ${options.name}`
                operationId = `${options.name}-get`
            }
            break
    }
    action.summary = action.summary || summary
    action.description = action.description || description
    action.operationId = action.id || action.operationId || operationId
    action.responses.default = action.responses.default || defaultResponse

    if (!action.tags) {
        action.tags = [options.name]
    }

    let parameters = []

    if (action.parameters) {
        action.parameters.forEach(param => {
            if (typeof param === 'string') {
                param = {
                    name: param
                }
            }

            parameters.push(param)
        })
    }

    if (options.params) {
        options.params.forEach(param => {
            if (typeof param === 'string') {
                param = {
                    name: param,
                    in: 'path',
                    required: true
                }
            }

            if (!parameters.find(value => value.name === param.name)) {
                parameters.push(param)
            }
        })
    }

    if (options.query) {
        options.query.forEach(param => {
            if (typeof param === 'string') {
                param = {
                    name: param,
                    type: 'string',
                    in: 'query',
                    required: false
                }
            }

            if (!parameters.find(value => value.name === param.name)) {
                parameters.push({
                    name: param.name,
                    type: param.type || 'string',
                    in: 'query',
                    required: param.required || false
                })
            }
        })
    }

    if (action.query) {
        action.query.forEach(param => {
            if (typeof param === 'string') {
                param = {
                    name: param,
                    in: 'query',
                    type: 'string',
                    required: false
                }
            }

            if (!parameters.find(value => value.name === param.name)) {
                parameters.push({
                    name: param.name,
                    type: param.type || 'string',
                    in: 'query',
                    required: param.required || false
                })
            }
        })
    }

    if (addBody && !parameters.find(value => value.name === 'body')) {
        parameters.push({
            name: 'body'
        })
    }

    parameters = setPermissions(parameters, action.permissions || options.permissions)

    parameters.forEach(param => {
        param = setHeaders(param)

        switch (options.type) {
            case 'get':
                param.in = param.in || 'path'
                if (param.required === undefined) {
                    param.required = true
                }
                break
            case 'post':
                param.in = param.in || 'body'
                if ('body|model'.indexOf(param.name) !== -1) {
                    param = setBody(param, options, 'create')
                }
                break
            case 'put':
                param.in = param.in || 'body'
                if ('body|model'.indexOf(param.name) !== -1) {
                    param = setBody(param, options, 'update')
                }
                break
        }

        param.type = param.type || 'string'
    })

    action.parameters = parameters

    return action
}

const parseUrl = (url, name) => {
    let parts = url.split('?')
    let query = []

    if (parts.length > 1) {
        url = parts[0]
        query = parts[1].split('&').map(q => {
            let p = q.split('=')

            var item = {
                name: p[0],
                in: 'query',
                required: false
            }

            if (p.length > 1) {
                let value = p[1]
                if (value.isObjectId()) {
                    item.type = 'string'
                    item.description = 'id'
                } else if (value === 'true' || value === 'false') {
                    item.type = 'boolean'
                } else {
                    item.type = 'string'
                }

                item.description = item.description || `eg: ${value}`
            }

            return item
        })
    }
    if (!url || url === '' || url === '/') {
        url = `/${name}`
    } else if (!(url.startsWith('/') || url.startsWith('.'))) {
        url = `/${url}`
    } else {
        url = `/${name}${url}`
    }

    let parsedUrl = ''

    let params = []

    url.split('/').forEach(p => {
        if (p) {
            if (p.startsWith(':')) {
                params.push(p.substring(1))
                p = `{${p.substring(1)}}`
            }
            parsedUrl = `${parsedUrl}/${p}`
        }
    })

    return {
        url: parsedUrl,
        params: params,
        query: query
    }
}

const extractDetails = (data, name) => {
    let parsedUrl = parseUrl(data.url, name)
    let item = {
        url: parsedUrl.url,
        actions: {}
    }

    for (const type of ['get', 'post', 'put', 'delete']) {
        if (data[type]) {
            item.actions[type] = parseAction(data[type], {
                type: type,
                name: name,
                params: parsedUrl.params,
                query: parsedUrl.query,
                permissions: data.permissions,
                url: data.url
            })
        }
    }

    return item
}

const fetch = (path) => {
    var id = require.resolve(path)
    if (require.cache[id] !== undefined) {
        delete require.cache[id]
    }

    return require(path)
}

exports.paths = () => {
    const paths = {}

    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            let name = changeCase.camelCase(file.split('.')[0])
            let data = fetch(`./${file}`)
            if (data.forEach) {
                data.forEach(item => {
                    let path = extractDetails(item, name)
                    paths[path.url] = path.actions
                })
            } else {
                let path = extractDetails(data, name)
                paths[path.url] = path.actions
            }
        }
    })

    return paths
}

exports.routes = () => {
    let models = []

    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            let fileName = file.split('.')[0]
            let data = require(`./${file}`)

            let items = data.items || data.routes || data

            models.push({
                name: data.name || changeCase.camelCase(fileName),
                controller: data.controller || fileName,
                routes: getRoutes(items)
            })
        }
    })

    return models
}
