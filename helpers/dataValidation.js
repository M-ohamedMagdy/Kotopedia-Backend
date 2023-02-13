const Joi = require('joi');
const customError = require('./customError');

const userSchema = Joi.object({
    name: Joi.string()
        .alphanum()
        .min(3)
        .max(20),

    email: Joi.string()
        .pattern(new RegExp('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{8,16}$')),

    gender: Joi.string()
        .pattern(new RegExp('^(Male|male|Female|female)$')),

    photo: Joi.object()

});

const userValidationMW  = async (req, res, next) => {
    try {
        await userSchema.validateAsync(req.body)
        next();
    } catch (error) {
        next(customError(406, error));
    }
}


module.exports = userValidationMW;