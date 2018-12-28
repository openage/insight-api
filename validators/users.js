'use strict';

const auth = require('../helpers/auth');

exports.canLogin =(req, callback) =>{
    if(!req.body.username){
        return callback('username is required');
    }
    if(!req.body.password){
        return callback('password is required');
    }
  
    return callback();
}

exports.canCreate = async(req, callback) =>{
    if(!req.body.emailId){
        return callback('email is required');
    }
    if(!req.body.password){
        return callback('password is required');
    }

    let isEmailExists = await db.user.find({where:{emailId: req.body.emailId}});
    if(isEmailExists){
        return callback('email already exists');
    }

    auth.getHash(req.body.password, (err, hash) => {
        if (err) {
            return callback(err);
        }
        req.body.password = hash;
        callback();
    });
    
}

exports.canUpdate = (req, callback) =>{

    if(req.body.permission){
        req.body.permission = JSON.stringify(req.body.permission)
    }
    if(!req.body.password){
        return callback();
    }

    auth.getHash(req.body.password, (err, hash) => {
        if (err) {
            return callback(err);
        }
        req.body.password = hash;
        callback();
    });
    
}