const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// mongoose.connect('mongodb+srv://kotopedia:kotopedia2@iti-ismailia.tjp396h.mongodb.net/kotopedia', () => console.log("Users & Orders model connected to Atlas DB successfully"));
mongoose.connect('mongodb://127.0.0.1:27017/kotopedia', () => console.log("User & Order model connected to Local DB successfully"));

const { Schema } = mongoose;

const userSchema = new Schema({ 
                                email: {type:String, unique:true},
                                name: String,
                                password: String,
                                gender: String,
                                photo: String,
                                role: {type:String, default:'customer'},
                                cart: []    // cart : [{},{},{title, quantity, unitPrice, category, image}]
                            });

const orderSchema = new Schema({
                                userID: { type:mongoose.Schema.ObjectId, ref:"users" },
                                email: String,
                                date: String,
                                status: {type:String, default:'pending'},
                                productsInOrder: []   // productsInOrder : [{},{},{title, quantity, unitPrice}]
                            });

userSchema.plugin(uniqueValidator);

const userModel = mongoose.model('users', userSchema);
const orderModel = mongoose.model('orders', orderSchema);


module.exports = {userModel, orderModel};