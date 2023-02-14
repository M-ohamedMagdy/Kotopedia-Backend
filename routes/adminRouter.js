const express = require('express');
const productModel = require('../models/productModel');
const {userModel, orderModel} = require('../models/userModel');
const {hashPassword, comparePassword, createToken, verifyToken, photoUpdateMW} = require('../helpers/userHelper');
const customError = require('../helpers/customError');

const adminRouter = express.Router();

const cors = require('cors');
const app = express();       
app.use(cors());

//////////////////////////////////////// Admin products requests ////////////////////////////////////////


// add one product to DB
adminRouter.post('/products', photoUpdateMW, async (req, res, next)=>{
    try {
        const {title, category, unitPrice, description, author, image} = req.body;
        const result = await cloud.uploads(req.file.path);
        if(req.file) photo = result.url;
        await productModel.create({title, category, unitPrice, description, author, image});
        fs.unlinkSync(req.file.path)
        res.status(200).send("new product added successfully");
    } catch (error) {
        next(error);
    }
})

// get all products
adminRouter.get('/products', async (req, res, next)=>{
    try {
        const products = await productModel.find();
        res.status(200).send(products);
    } catch (error) {
        next(error);
    }
})

// filter products by category
adminRouter.get('/products/:category', async (req, res, next)=>{
    try {
        const { category } = req.params;
        const categoryProducts = await productModel.find({category});
        res.status(200).send(categoryProducts);
    } catch (error) {
        next(error);
    }
})

// update product info
adminRouter.patch('/products', photoUpdateMW, async (req, res, next)=>{
    try {
        const { id, title, category, unitPrice, description, author, image } = req.body;
        const product = await productModel.findOne({_id:id});
        if(!product) customError(404, `can not find a book with id ${id}`);
        // photo remained unhandled ?????????????
        await productModel.findByIdAndUpdate(id,{title, category, unitPrice, description, author, image});
        res.status(200).send("Book info successfully updated");
    } catch (error) {
        next(error);
    }
})

// delete all products
adminRouter.delete('/products', async (req, res, next)=>{
    try {
        await productModel.deleteMany();
        res.status(200).send("deleted all data successfully");
    } catch (error) {
        next(error);
    }
})

// delete one product by id
adminRouter.delete('/products/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        await productModel.deleteOne({_id:id});
        res.status(200).send(`deleted product with id ${id} successfully`);
    } catch (error) {
        next(error);
    }
})


//////////////////////////////////////// Admin users requests ////////////////////////////////////////


// get all users
adminRouter.get('/users', async (req, res, next)=>{
    try {
        const allUsers = await userModel.find();
        if(!allUsers) res.status(404).send("can not find any users");
        res.status(200).send(allUsers);
    } catch (error) {
        next(error);
    }
})

// get one user by id
adminRouter.get('/users/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);
        if(!user) res.status(404).send("can not find any user with mentioned ID");
        res.status(200).send(user);
    } catch (error) {
        next(error);
    }
})

// delete one user by id
adminRouter.delete('/users/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        await userModel.deleteOne({_id:id});
        res.status(200).send(`deleted user with id ${id} successfully`);
    } catch (error) {
        next(error);
    }
})

// delete all users
adminRouter.delete('/users', async (req, res, next)=>{
    try {
        await userModel.deleteMany();
        res.status(200).send("deleted all users successfully");
    } catch (error) {
        next(error);
    }
})


//////////////////////////////////////// Admin orders requests ////////////////////////////////////////


// get all orders
adminRouter.get('/orders', async (req, res, next)=>{
    try {
        const orders = await orderModel.find();
        res.status(200).send(orders);
    } catch (error) {
        next(error);
    }
})

// get one order by id
adminRouter.get('/orders/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        const order = await orderModel.findOne({_id:id});
        res.status(200).send(order);
    } catch (error) {
        next(error);
    }
})


// update an order status
adminRouter.patch('/orders', async (req, res, next)=>{
    try {
        const { orderID, status } = req.body;
        const order = await orderModel.findOne({_id:orderID});
        if(order.status !== 'pending') res.status(200).send(`can not update status for this order anymore`);
        await orderModel.findByIdAndUpdate(orderID,{status});
        res.status(200).send(`order status successfully updated to ${status}`);
    } catch (error) {
        next(error);
    }
})



module.exports = adminRouter;