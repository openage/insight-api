'use strict'

exports.updateFields = (data) => {
    var index,
        field,
        newValue

    var retVal = {
        changes: [],
        changedFields: [],
        updateData: {}
    }

    for (index in data.fields) {
        field = data.fields[index]

        newValue = data.newValues[field]
        if (data.modelObj[field] !== newValue) {
            var obj = {
                field: field,
                oldValue: data.modelObj[field],
                newValue: newValue
            }
            retVal.updateData[field] = newValue

            retVal.changedFields.push(field)
            retVal.changes.push(obj)
            data.modelObj[field] = newValue
        }
    }

    return retVal
}
