const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

mongoose.connect('mongodb+srv://kotopedia:kotopedia2@iti-ismailia.tjp396h.mongodb.net/kotopedia', () => console.log("Users model connected to Atlas DB successfully"));
// mongoose.connect('mongodb://127.0.0.1:27017/kotopedia', () => console.log("Products model connected to DB successfully"));

const { Schema } = mongoose;
const productSchema = new Schema({
                                    title: {type:String, unique:true},
                                    category: String,
                                    unitPrice: Number,
                                    description: String,
                                    author: String,
                                    image: String
                                });

productSchema.plugin(uniqueValidator);

const productModel = mongoose.model('products', productSchema);

module.exports = productModel;