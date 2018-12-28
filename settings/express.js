'use strict';

const express = require('express');
const logger = require('@open-age/logger')('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

module.exports.configure =(app) =>{
    const log = logger.start('config');
    const root = path.normalize(__dirname + './../');    
    app.use((err, req, res, next) => {
        if(err){
            (res.log || log).error(err.stack);
            if(req.xhr){
                 res.send(500, { error: 'Something Blew Up'});
            }else{
                next(err);
            }
            return;
        }
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser({ limit: '50mb', keepExtensions: true }));
    app.set('views', path.join(root, 'views'));
    app.set('view engine', 'pug');
    app.use(express.static(path.join(root, 'public')));
};