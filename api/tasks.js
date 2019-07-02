'use strict'

const service = require('../services/tasks')
const mapper = require('../mappers/tasks')

const offline = require('@open-age/offline-processor')

exports.create = async (req) => {
    const task = await service.create(req.body, req.context)
    return mapper.toModel(task)
}

exports.run = async (req) => {
    const task = await service.get(req.params.id, req.context)
    // if ('new|error'.indexOf(task.status) === -1) {
    //     throw new Error(`cannot run a task in state '${task.status}'`)
    // }

    if ('job|processor'.indexOf(task.assignedTo) === -1) {
        throw new Error(`cannot run a task of type '${task.assignedTo}'`)
    }

    task.status = 'queued'
    await task.save()
    await offline.queue('task', 'run', task, req.context)
    return 'queued'
}

exports.get = async (req) => {
    const task = await service.get(req.params.id, req.context)

    return mapper.toModel(task)
}

exports.search = async (req) => {
    const query = {}

    if (!req.query.status) {
        query.status = 'new'
    } else if (req.query.status !== 'any') {
        query.status = req.query.status
    }

    if (req.query.deviceId !== 'any') {
        if (req.query.device) {
            query.device = req.query.device
        } else if (req.query.deviceId) {
            query.device = req.query.deviceId
        } else {
            query.device = null
        }
    }

    if (req.query.assignedTo) {
        query.assignedTo = req.query.assignedTo
    } else {
        query.assignedTo = 'sync-service'
    }

    if (req.query.from) {
        query.date = {
            $gte: req.query.from
        }
    }

    const tasks = await service.search(query, req.context)

    return mapper.toSearchModel(tasks)
}

exports.update = async (req, res) => {
    const task = await service.update(req.params.id, req.body, req.context)

    return mapper.toModel(task)
}
