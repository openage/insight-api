exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }

    if (entity._bsontype === 'ObjectId') {
        return {
            id: entity.toString()
        }
    }

    return {
        id: entity.id,
        code: entity.code,
        name: entity.name
    }
}

exports.toSummary = (entity, context) => {
    if (!entity) {
        return
    }

    if (entity._bsontype === 'ObjectId') {
        return {
            id: entity.toString()
        }
    }

    return {
        id: entity.id,
        code: entity.code,
        name: entity.name
    }
}
