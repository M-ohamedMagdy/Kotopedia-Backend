const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util');
const customError = require('./customError');

const saltRounds = 10;
const secretTokenKey = 'meanStackProjectKOTOPEDIA';

const asyncSignToken = util.promisify(jwt.sign);
const asyncVerifyToken = util.promisify(jwt.verify);

const hashPassword = (password) => bcrypt.hash(password, saltRounds);

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const createToken = (id) => asyncSignToken({id}, secretTokenKey, {expiresIn:60*15})

const verifyToken = (token) => asyncVerifyToken(token, secretTokenKey)

module.exports = { hashPassword, comparePassword, createToken, verifyToken };