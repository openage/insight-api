'use strict';

const mapper = require('../mappers/user');
const auth = require('../helpers/auth');
const { updateFields } = require('../helpers/dbquery')

exports.create = (req, res) => {

  db.user.build({
    firstname:  req.body.firstname,
    lastname:  req.body.lastname,
    emailId:  req.body.emailId,
    mobile:  req.body.mobile,
    password:  req.body.password,
    role:  req.body.role,
    createdAt: new Date(),
    permission:  JSON.stringify(req.body.permission)
  }).save().then((user) => {
    if (!user) {
      return res.failure('failed to create user');
    }
    user.token = auth.getToken(user);
    user.save();
    return res.data(mapper.toModel(user));
  }).catch(err => {
    return res.failure(err);
  });
}

exports.login = (req, res) =>{

  db.user.find({
    where:{
      emailId: req.body.username
     }    
  })
  .then((user)=>{
       if(!user){
         return res.failure('no user found')
       }

      auth.comparePassword(req.body.password, user.password, (err, isSuccess) =>{
         if (err) {
            return res.failure(err);
         }
         if (!isSuccess) {
            return res.failure('Invalid username or password!');
        }
         return res.data(mapper.toModel(user));          
      });

  }).catch(err => {
    return res.failure(err);
  });
  
}

exports.update = (req, res) =>{

  db.user.find({
    where: {
      id: req.params.id
    }
  })
  .then((user)=>{
    if(!user){
      return res.failure('no user found')
    }
   let changes = updateFields({
      fields: ['firstname', 'lastname', 'role', 'permission', 'emailId', 'mobile', 'password'],
      newValues: req.body,
      modelObj: user
  });

  user.save(changes)
  .then((updatedUser)=>{
    return res.data(mapper.toModel(user)); 
  })
  .catch(err=>{
    return res.failure(err)
  })
  })
}

exports.search = (req, res) =>{
  db.user.findAll({
    where:{}
  })
  .then((users)=>{
    if(!users){
      return res.failure('no users found');
    }
    return res.page(mapper.toSearchModel(users))
  })
}