const express = require('express');
const productModel = require('../models/productModel');
const customError = require('../helpers/customError');

const productRouter = express.Router();

// add one product to DB
productRouter.post('/', async (req, res, next)=>{
    try {
        const {title, category, unitPrice, description, author, image} = req.body;
        await productModel.create({title, category, unitPrice, description, author, image});
        res.status(200).send("new product added successfully");
    } catch (error) {
        next(error);
    }
})

// get all products
// filter products by category
productRouter.get('/', async (req, res, next)=>{
    try {
        const { category } = req.body;
        if(category){
            const categoryProducts = await productModel.find({category});
            res.status(200).send(categoryProducts);
        }
        else{
            const products = await productModel.find();
            res.status(200).send(products);
        }
    } catch (error) {
        next(error);
    }
})

// delete all products
// delete one product by title
productRouter.delete('/', async (req, res, next)=>{
    try {
        const { title } = req.body;
        if(title){
            await productModel.deleteOne({title});
        }
        else{
            await productModel.deleteMany();
        }
        res.status(200).send("deleted all data successfully");
    } catch (error) {
        next(error);
    }
})

module.exports = productRouter;