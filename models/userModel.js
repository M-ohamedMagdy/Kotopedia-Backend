const { string } = require('joi');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

mongoose.connect('mongodb://127.0.0.1:27017/kotopedia', () => console.log("Connected to DB successfully"));

const { Schema } = mongoose;
const userSchema = new Schema({ 
                                email: {type:String, unique:true},
                                name: String,
                                password: String,
                                gender: String,
                                photo: String,
                                role: {type:String, default:'customer'},
                                cart: [],
                                order: []
                            });

userSchema.plugin(uniqueValidator);

const userModel = mongoose.model('users', userSchema);

module.exports = userModel;