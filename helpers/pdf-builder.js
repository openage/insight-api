const fsConfig = require('config').get('folders')
const appRoot = require('app-root-path')
var fs = require('fs')

const pdfMake = require('pdfmake/build/pdfmake')

const pdffonts = require('pdfmake/build/vfs_fonts')

pdfMake.vfs = pdffonts.pdfMake.vfs

const moment = require('moment')

const defaultPageStyle = {
    pageOrientation: 'portrait',
    pageSize: 'A5',
    pageMargins: [40, 60, 40, 60]
}

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

const injectPageStyle = (doc, report, context) => {
    let style = report.type.config.style || {}
    const pageConfig = style.page || {}

    doc.pageOrientation = defaultPageStyle.pageOrientation
    doc.pageSize = defaultPageStyle.pageSize
    doc.pageMargins = defaultPageStyle.pageMargins

    if (pageConfig.orientation) {
        doc.pageOrientation = pageConfig.orientation
    }

    if (pageConfig.size) {
        doc.pageSize = pageConfig.size
    }

    if (pageConfig.margins) {
        doc.pageMargins = pageConfig.margins
    }
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

const injectStyle = (item, style) => {
    style = style || {}
    if (style.font) {
        if (style.font.sz) {
            item.fontSize = style.font.sz
        }

        if (style.font.bold) {
            item.bold = style.font.bold
        }

        if (style.font.italics) {
            item.italics = style.font.italics
        }

        if (style.font.color) {
            item.color = style.font.color
        }
    }
    if (style.align) {
        item.alignment = style.align // center, 'justify'
    }

    if (style.margin) {
        item.margin = style.margin // [0, 0, 0, 8]
    }

    if (style.fill) {
        item.fillColor = style.fill
    }
}

const injectHeader = (docDefinition, pageHeaderRows, report, context) => {
    let content = []

    pageHeaderRows.forEach(row => {
        let item = {}

        if (row instanceof Array) {
            item.columns = []

            row.forEach(c => {
                let i = {
                    text: c.text
                }
                injectStyle(i, c.style)
                item.columns.push(i)
            })
        } else {
            item.text = row.text
            injectStyle(item, row.style)
        }

        content.push(item)
    })

    docDefinition.header = () => {
        return content
    }
}

const injectFooter = (doc) => {
    doc.footer = (currentPage, pageCount) => {
        return {
            columns: [
                '',
                { text: currentPage.toString() + ' of ' + pageCount, alignment: 'right' }
            ]
        }
    }
}

const getLayout = (report, context) => {
    let style = report.type.config.style || {}
    const tableConfig = style.table || {}

    let layout = tableConfig.layout || 'lightHorizontalLines'

    switch (layout) {
    case 'zebra':
        return {
            fillColor: function (rowIndex, node, columnIndex) {
                return (rowIndex % 2 === 0) ? '#CCCCCC' : null
            }
        }

    default:
        return layout
    }
}

const setTableHeader = (row, widths, headers) => {
    headers.forEach(header => {
        let style = header.style || {}

        if (style.width) { // *, auto or a value
            widths.push(style.width)
        } else {
            widths.push('auto')
        }

        let item = {
            text: header.label
        }

        injectStyle(item, style)

        row.push(item)
    })

    return row
}

const setValue = (row, header, data) => {
    if (!data[header.key]) {
        row.push('')
        return
    }

    let item = {
        text: data[header.key]
    }

    injectStyle(item, header.style.value)

    row.push(item)
}

const buildDataHeaders = (columns, styles) => {
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

const toFile = (docDefinition, fileName) => {
    return new Promise((resolve, reject) => {
        let filePath = fsConfig.temp ? `${fsConfig.temp}/${fileName}` : `${appRoot}/temp/${fileName}`

        pdfMake.createPdf(docDefinition).getBuffer((result, pages) => {
            fs.writeFile(filePath, result, (err) => {
                if (err) {
                    return reject(err)
                }

                resolve(filePath)
            })
        })
    })
}

module.exports = (report, totalRows, context) => {
    let tableDataHeaders = buildDataHeaders(report.type.columns)

    let tableDataRows = []

    let pageHeaderRows

    return {
        setRow: (data) => {
            let dataRow = []
            for (const dataHeader of tableDataHeaders) {
                setValue(dataRow, dataHeader, data)
            }
            tableDataRows.push(dataRow)
        },

        setHeader: (sheetHeaderRows) => {
            pageHeaderRows = sheetHeaderRows
        },
        build: async () => {
            let body = []

            let widths = []
            let tableHeaderRow = []
            setTableHeader(tableHeaderRow, widths, tableDataHeaders)
            body.push(tableHeaderRow)

            body.push(...tableDataRows)

            var doc = {
                info: {
                    title: report.type.name,
                    author: `${context.user.profile.firstName} ${context.user.profile.lastName || ''}`.trim(),
                    subject: report.type.name,
                    keywords: `${context.organization.code} ${report.type.code}`,
                    creator: 'Open Age Insights'
                },
                content: [{
                    layout: getLayout(report, context),
                    table: {
                        headerRows: 1,
                        widths: widths,
                        body: body
                    }
                }]
            }

            injectPageStyle(doc, report, context)
            injectFooter(doc, report, context)
            injectHeader(doc, pageHeaderRows, report, context)

            let fileName = `${context.organization.code}-${report.type.code}-${moment().format('YY-MM-DD-HH-mm')}.pdf`
            let path = await toFile(doc, fileName)
            return {
                name: fileName,
                path: path
            }
        }

    }
}
