
module.exports = (mapperOptions) => {
    mapperOptions = mapperOptions || {}

    mapperOptions.sheetName = mapperOptions.sheetName || 'data'

    mapperOptions.headerRow = mapperOptions.headerRow || {}
    mapperOptions.headerRow.csv = 0
    mapperOptions.headerRow.xlsx = mapperOptions.headerRow.xlsx || 0
    mapperOptions.keyCol = mapperOptions.keyCol || 0

    mapperOptions.columnMaps = mapperOptions.columnMaps || {}

    return {
        config: async (req, options) => {
            let format = options.format || 'default'
            return {
                sheet: mapperOptions.sheetName,
                timeZone: req.context.config.timeZone,
                columnMap: mapperOptions.columnMaps[format],
                modelMap: mapperOptions.modelMap,
                headerRow: mapperOptions.headerRow[options.type],
                keyCol: 0
            }
        }
    }
}
