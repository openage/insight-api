const excelBuilder = require('msexcel-builder')
const fsConfig = require('config').get('folders')
const appRoot = require('app-root-path')

const moment = require('moment')

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

const newWorkbook = fileName => {
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

const setRow = (sheet, row, rowNo) => {
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

const setHeader = (sheet, row, headers) => {
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
        if (header.style.border) {
            sheet.border(header.col, row, header.style.border)
        }
        if (header.style.fill) {
            sheet.fill(header.col, row, header.style.fill)
        }
        sheet.set(header.col, row, header.label)
    })

    return row
}

const setValue = (sheet, row, header, item) => {
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

const buildHeaders = (columns, styles) => {
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

module.exports = (report, totalRows, context) => {
    let fileName = `${context.organization.code}-${report.type.code}-${moment().format('YY-MM-DD-HH-mm')}.xlsx`
    const file = newWorkbook(fileName)

    let headers = buildHeaders(report.type.columns)
    var sheet = file.createSheet(report.type.config.sheet || report.type.code, headers.length + 5, totalRows + 5)

    let currentRow = 0

    return {
        setRow: (data) => {
            currentRow = currentRow + 1
            for (const header of headers) {
                setValue(sheet, currentRow, header, data)
            }

            // reportBuilder.setValue(sheet, currentRow, header, formatResult(row, report, context))
            // excel.setRow(sheet, data, currentRow)
        },

        setHeader: (sheetHeaderRows) => {
            sheetHeaderRows.forEach(row => {
                currentRow = currentRow + 1
                setRow(sheet, row, currentRow)
            })

            currentRow = setHeader(sheet, currentRow + 1, headers)
        },
        build: async () => {
            let result = await file.save()

            let filePath = fsConfig.temp ? `${fsConfig.temp}/${result.fileName}` : `${appRoot}/temp/${result.fileName}`

            return {
                name: result.fileName,
                path: filePath
            }
        }

    }
}
