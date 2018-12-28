'use strict';

var moment = require('moment');

const reportTableSuffix = function (date) {
    return '';
};

exports.getReportTable = (date) => {
    const reportTable = 'ReportTables';
    return date ? reportTable + reportTableSuffix(date) : reportTable;
};

exports.reportTableSuffix = reportTableSuffix;
