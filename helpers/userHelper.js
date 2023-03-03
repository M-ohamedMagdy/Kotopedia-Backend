const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util');
const customError = require('./customError');
const cloud = require('../cloudinaryConfig'); 
const fs = require('fs');
const multer = require('multer');

const saltRounds = 10;
const secretTokenKey = 'meanStackProjectKOTOPEDIA';

const asyncSignToken = util.promisify(jwt.sign);
const asyncVerifyToken = util.promisify(jwt.verify);

const hashPassword = (password) => bcrypt.hash(password, saltRounds);

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const createToken = (id) => asyncSignToken({id}, secretTokenKey, {expiresIn:'30m'});

const verifyToken = (token) => asyncVerifyToken(token, secretTokenKey);

const multerStorage = multer.diskStorage({
    destination:(req,file,cb)=>{ cb(null,'./assets') },
    filename:(req,file,cb)=>{ cb(null,file.originalname) }
})

const multerFilter = (req,file,cb)=>{
    if(
        file.mimetype === 'image/png'||
        file.mimetype === 'image/jpg'||
        file.mimetype === 'image/jpeg'
    ){
        cb(null,true)
    }else{
        cb(null,false)
    }
}

const upload = multer({storage:multerStorage ,fileFilter:multerFilter});

const photoUpdateMW = upload.single('photo');

module.exports = { hashPassword, comparePassword, createToken, verifyToken, photoUpdateMW };