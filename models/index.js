'use strict';
const fs = require('fs');
const path = require('path');
const basename = path.basename(module.filename);
const lodash = require('lodash');

let initModels = () => {
    let db = {};
    fs.readdirSync(__dirname)
        .filter((file) => {
            return (file.indexOf('.') !== 0) && (file !== basename);
        })
        .forEach((file) => {
            let model = sequelize['import'](path.join(__dirname, file));
            db[model.name] = model;
        });

    db.user.hasMany(db.reportRequest);

    db.user.hasMany(db.favorites);
    db.favorites.belongsTo(db.user);

    db.reportRequest.hasMany(db.favorites);
    db.favorites.belongsTo(db.reportRequest);

    Object.keys(db).forEach((modelName) => {
        if ('associate' in db[modelName]) {
            db[modelName].associate(db);
        }
    });
    return db;
};

module.exports = lodash.extend({
    sequelize: sequelize,
    Sequelize: Sequelize
}, initModels());
