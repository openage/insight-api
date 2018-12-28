'use strict';
const db = require('../models');
const offline = require('../helpers/offline');

const create = (model, context) => {
    var reportRequest = db.reportRequest.build({
        type: model.type,
        provider: model.provider,
        requestedAt: new Date(),
        reportParams: JSON.stringify(model.params),
        status: 'new',
        userId: context.user.id
    });

    return reportRequest.save().then(report => {
        context.processSync = false;
        offline.queue('report-request', 'create', {
            id: report.id
        }, context);

        return report;
    });
};


exports.create = create;
