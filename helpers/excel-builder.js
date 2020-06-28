// const excelBuilder = require('msexcel-builder')
const Excel = require('exceljs')
const fsConfig = require('config').get('folders')
const appRoot = require('app-root-path')

Excel.config.setValue('promise', require('bluebird'))

const moment = require('moment')

let columnNames = []

const createColumns = () => {
    const names = 'A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z'.split('|')
    columnNames.push(...names)
    for (const prefix of names) {
        for (const postfix of names) {
            columnNames.push(`${prefix}${postfix}`)
        }
    }
}

createColumns()

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
    // https://github.com/exceljs/exceljs#fonts
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

const newWorkbook = async (reportType, context) => {
    let dir = fsConfig.temp || `${appRoot}/temp/`

    const fileName = `${context.organization.code}-${reportType.code}-${moment().format('YY-MM-DD-HH-mm')}.xlsx`

    const excel = reportType.download.excel
    const workbook = new Excel.Workbook()

    let template = excel.config.template
    if (template) {
        await workbook.xlsx.readFile(`${appRoot}/templates/${template}`)
    }

    let sheet

    const createSheet = (name, columns, rows) => {
        sheet = workbook.getWorksheet(name)
        if (!sheet) {
            sheet = workbook.addWorksheet(name) //, columns, rows)
        }
        return sheet
    }

    const save = async () => {
        const path = `${dir}/${fileName}`

        await workbook.xlsx.writeFile(path)
        return {
            fileName: fileName,
            dir: dir,
            path: path
        }
    }

    return {
        workbook: workbook,
        createSheet: createSheet,
        sheet: sheet,
        save: save
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
    const excelRow = sheet.getRow(rowNo)
    items.forEach(item => {
        let colNo = item.col || 1

        if (item.to) {
            sheet.mergeCells(`${columnNames[colNo - 1]}${rowNo}:${columnNames[item.to - 1]}${rowNo}`)
        }
        const excelCell = excelRow.getCell(colNo)

        // if (item.to) {
        //     sheet.merge({
        //         col: colNo,
        //         row: rowNo
        //     }, {
        //         col: item.to,
        //         row: rowNo
        //     })
        // }

        // let style = item.style || {}
        // if (style.width) {
        //     sheet.width(colNo, style.width)
        // }

        // if (style.font) {
        //     sheet.font(colNo, rowNo, style.width)
        // }
        // if (style.align) {
        //     sheet.align(colNo, rowNo, style.align)
        // }

        // if (style.border) {
        //     sheet.border(colNo, rowNo, style.border)
        // }

        // if (style.fill) {
        //     sheet.fill(colNo, rowNo, style.fill)
        // }

        // sheet.set(colNo, rowNo, item.text)
        excelCell.value = item.text
    })
}

const setHeader = (sheet, rowNo, headers) => {
    const excelRow = sheet.getRow(rowNo)
    headers.forEach(header => {
        const excelCell = excelRow.getCell(header.col)
        // if (header.style.width) {
        //     sheet.width(header.col, header.style.width)
        // }

        // if (header.style.font) {
        //     sheet.font(header.col, row, header.style.font)
        // }
        // if (header.style.align) {
        //     sheet.align(header.col, row, header.style.align)
        // }
        // if (header.style.border) {
        //     sheet.border(header.col, row, header.style.border)
        // }
        // if (header.style.fill) {
        //     sheet.fill(header.col, row, header.style.fill)
        // }
        // sheet.set(header.col, row, header.label)
        excelCell.value = header.text
    })

    return rowNo
}

const setValue = (sheet, rowNo, header, item) => {
    const excelRow = sheet.getRow(rowNo)
    const excelCell = excelRow.getCell(header.col)

    if (item[header.key]) {
        excelCell.value = header.text
    }

    // if (header.style.value.font) {
    //     sheet.font(header.col, rowNo, header.style.value.font)
    // }

    // if (header.style.value.align) {
    //     sheet.align(header.col, rowNo, header.style.value.align)
    // }

    // if (header.style.value.border) {
    //     sheet.border(header.col, rowNo, header.style.value.border)
    // }

    // if (item[header.key]) {
    //     sheet.set(header.col, rowNo, item[header.key])
    // }
}

const buildHeaders = (columns, styles, columnNo) => {
    styles = styles || {}
    let headerStyle = setStyle(styles.headers, defaultHeaderStyle)
    let valueStyle = setStyle(styles.values, defaultValueStyle)

    let headers = []
    columnNo = columnNo || 1
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

exports.file = async (reportType, totalRows, context) => {
    const excel = reportType.download.excel || {}

    const config = excel.config || {}

    config.from = config.from || {}
    config.styles = config.styles || {}

    config.from.row = config.from.row || 1
    config.from.column = config.from.column || 1

    let headers = buildHeaders(reportType.fields, config.styles, config.from.column)

    let columnSpan = config.from.column + headers.length
    let rowSpan = config.from.row + totalRows

    const workbook = await newWorkbook(reportType, context)
    let sheet = workbook.createSheet(excel.sheet || reportType.code, columnSpan + 5, rowSpan + 5)

    const skipSheetHeader = !!excel.config.template

    let currentRow = 0

    return {
        setRow: (data) => {
            currentRow = currentRow + 1
            for (const header of headers) {
                setValue(sheet, currentRow, header, data)
            }
        },

        setHeader: (report) => {
            if (skipSheetHeader) {
                currentRow = config.from.row
                return
            }
            let sheetHeaders = JSON.parse(JSON.stringify(excel.headers || []).inject({
                data: report.toObject(),
                context: context.toObject()
            }))

            const setDefaults = (item) => {
                if (!item.column) {
                    item.col = config.from.column
                    item.to = columnSpan
                } else if (item.column instanceof Array && item.column.length) {
                    item.col = item.column[0]
                    if (item.column.length === 2) {
                        item.to = item.column[1]
                    }
                } else {
                    item.col = item.column
                }
            }

            sheetHeaders.forEach(row => {
                currentRow = currentRow + 1
                if (row instanceof Array) {
                    row.forEach(r => setDefaults(r))
                } else {
                    setDefaults(row)
                }
                setRow(sheet, row, currentRow)
            })

            currentRow = setHeader(sheet, currentRow + 1, headers)

            if (currentRow < config.from.row) {
                currentRow = config.from.row
            }
        },
        build: async () => {
            let result = await workbook.save()

            let filePath = fsConfig.temp ? `${fsConfig.temp}/${result.fileName}` : `${appRoot}/temp/${result.fileName}`

            return {
                name: result.fileName,
                path: filePath
            }
        }

    }
}
