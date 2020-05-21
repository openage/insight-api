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
        profile: {
            pic: {
                url: entity.profile.pic.url
            },
            firstName: entity.profile.firstName,
            lastName: entity.profile.lastName
        },
        role: {
            id: entity.role.id
        },
        timeStamp: entity.timeStamp
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
        profile: {
            pic: {
                url: entity.profile.pic ? entity.profile.pic.url : null
            },
            firstName: entity.profile.firstName,
            lastName: entity.profile.lastName
        }
    }
}
