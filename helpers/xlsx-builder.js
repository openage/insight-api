const excelBuilder = require('msexcel-builder')
const fsConfig = require('config').get('folders')
const appRoot = require('app-root-path')

const defaultHeaderStyle = {
    width: 12.0,
    border: {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    },
    font: { sz: '10', bold: true },
    align: 'center'
}

const defaultValueStyle = {
    width: 12.0,
    border: {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    },
    font: { sz: '10' },
    align: 'left'
}

const setStyle = (style, defaultStyle) => {
    style = style || {}
    if (style.width === undefined) {
        style.width = defaultStyle.width
    }

    if (style.border === undefined) {
        style.border = defaultStyle.border
    }

    if (style.font === undefined) {
        style.font = defaultStyle.font
    }

    if (style.align === undefined) {
        style.align = defaultStyle.align
    }

    return style
}

exports.newWorkbook = fileName => {
    let dir = fsConfig.temp || `${appRoot}/temp/`

    let workbook = excelBuilder.createWorkbook(dir, fileName)
    let sheet

    const createSheet = (name, columns, rows) => {
        sheet = workbook.createSheet(name, columns, rows)
        return sheet
    }

    return {
        workbook: workbook,
        createSheet: createSheet,
        sheet: sheet,
        save: () => {
            return new Promise((resolve, reject) => {
                workbook.save(function (err) {
                    if (!err) {
                        return resolve({
                            fileName: fileName,
                            dir: dir,
                            path: `${dir}/${fileName}`
                        })
                    }
                    workbook.cancel()
                    return reject(err)
                })
            })
        }
    }
}

exports.setRow = (sheet, row, rowNo) => {
    if (!row) {
        return
    }
    let items = []

    if (row instanceof Array) {
        items = row
    } else {
        items.push(row)
    }

    if (!items.length) {
        return
    }
    items.forEach(item => {
        let colNo = item.col || 1

        if (item.to) {
            sheet.merge({
                col: colNo,
                row: rowNo
            }, {
                col: item.to,
                row: rowNo
            })
        }

        let style = item.style || {}
        if (style.width) {
            sheet.width(colNo, style.width)
        }

        if (style.font) {
            sheet.font(colNo, rowNo, style.width)
        }
        if (style.align) {
            sheet.align(colNo, rowNo, style.align)
        }

        if (style.border) {
            sheet.border(colNo, rowNo, style.border)
        }

        if (style.fill) {
            sheet.fill(colNo, rowNo, style.fill)
        }

        sheet.set(colNo, rowNo, item.text)
    })
}

exports.setHeader = (sheet, row, headers) => {
    headers.forEach(header => {
        if (header.style.width) {
            sheet.width(header.col, header.style.width)
        }

        if (header.style.font) {
            sheet.font(header.col, row, header.style.font)
        }
        if (header.style.align) {
            sheet.align(header.col, row, header.style.align)
        }
        if (header.style.width) {
            sheet.border(header.col, row, header.style.border)
        }
        if (header.style.border) {
            sheet.fill(header.col, row, header.style.fill)
        }
        sheet.set(header.col, row, header.label)
    })

    return row
}

exports.setValue = (sheet, row, header, item) => {
    if (header.style.value.font) {
        sheet.font(header.col, row, header.style.value.font)
    }

    if (header.style.value.align) {
        sheet.align(header.col, row, header.style.value.align)
    }

    if (header.style.value.border) {
        sheet.border(header.col, row, header.style.value.border)
    }

    if (item[header.key]) {
        sheet.set(header.col, row, item[header.key])
    }
}

exports.buildHeaders = (columns, styles) => {
    styles = styles || {}
    let headerStyle = setStyle(styles.headers, defaultHeaderStyle)
    let valueStyle = setStyle(styles.values, defaultValueStyle)

    let headers = []
    let columnNo = 1
    columns.forEach(column => {
        let item = {}
        if (typeof column === 'string') {
            item.label = item
            item.key = item
        } else {
            item.label = column.label
            item.key = column.key
            item.style = column.style
        }
        if (!item.label) {
            item.label = item.key
        }
        item.col = columnNo

        if (!item.style) {
            item.style = styles[item.key] || {}
        }

        if (item.style.width === undefined) {
            item.style.width = headerStyle.width
        }
        if (item.style.font === undefined) {
            item.style.font = headerStyle.font
        }
        if (item.style.align === undefined) {
            item.style.align = headerStyle.align
        }
        if (item.style.border === undefined) {
            item.style.border = headerStyle.border
        }

        item.style.value = item.style.value || {}
        if (item.style.value.width === undefined) {
            item.style.value.width = valueStyle.width
        }
        if (item.style.value.font === undefined) {
            item.style.value.font = valueStyle.font
        }

        if (item.style.value.align === undefined) {
            item.style.value.align = valueStyle.align
        }
        if (item.style.value.border === undefined) {
            item.style.value.border = valueStyle.border
        }
        headers.push(item)
        columnNo = columnNo + 1
    })

    return headers
}
