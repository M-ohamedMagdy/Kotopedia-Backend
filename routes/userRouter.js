const express = require('express');
const {hashPassword, comparePassword, createToken, verifyToken} = require('../helpers/userHelper');
const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const userValidationMW = require('../helpers/dataValidation');
const customError = require('../helpers/customError');

const userRouter = express.Router();

// add new user
userRouter.post('/signup', userValidationMW, async (req, res, next)=>{
    try {
        const {name, email, password, gender, photo} = req.body;
        const hashedPassword = await hashPassword(password);
        const newUser = await userModel.create({name, email, password : hashedPassword, gender, photo});
        res.status(200).send(newUser);
    } catch (error) {
        next(error);
    }
})

// login for existing user
userRouter.post('/login', async (req, res, next)=>{
    try {
        const {email, password} = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(401,'Invalid email or password');
        const result = await comparePassword(password, user.password);
        if(!result){throw customError(401, 'Invalid email or password')};
        const token = await createToken(user.id);
        res.status(200).send({accessToken: token})/*.cookie('accessToken', token, { expires: new Date(Date.now() + (60*15*1000)), httpOnly: true });*/
    } catch (error) {
        next(error);
    }
})

// add product to cart
userRouter.post('/cart', async (req, res, next)=>{
    try {
        const { email, title } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        const { unitPrice, category, image } = await productModel.findOne({title});
        user.cart.push({title, quantity:1, unitPrice, category, image});
        user.save();
        res.status(200).send("product successfully added to cart");
    } catch (error) {
        next(error);
    }
})

// add order to buy one item
// add order for user ( all cart )
userRouter.post('/orders', async (req, res, next)=>{
    try {
        const { email, title } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        const d = new Date();
        const date = `${d.getDate()}/${(d.getMonth())+1}/${d.getFullYear()}`;
        const orderID = Date.now();
        if(title){
            const {unitPrice} = await productModel.findOne({title});
            const productsInOrder = [{title, quantity:1, unitPrice}];
            user.order.push({productsInOrder, status:'pending', date, orderID});
        }
        else{
            const productsInOrder = user.cart.filter(()=>true);
            user.order.push({productsInOrder, status:'pending', date, orderID});
        }
        user.save();
        res.status(200).send("order successfully added to user orders");
    } catch (error) {
        next(error);
    }
})


// get one user info for profile page
userRouter.get('/profile', async (req, res, next)=>{
    try {
        const { email } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        res.status(200).send(user);
    } catch (error) {
        next(error);
    }
})

// get all products in cart
userRouter.get('/cart', async (req, res, next)=>{
    try {
        const { email } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        res.status(200).send(user.cart);
    } catch (error) {
        next(error);
    }
})

// get all user orders
userRouter.get('/orders', async (req, res, next)=>{
    try {
        const { email } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        res.status(200).send(user.order);
    } catch (error) {
        next(error);
    }
})

// empty user cart
// remove one product from  cart by title
userRouter.delete('/cart', async (req, res, next)=>{
    try {
        const { email, title } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        if(title){
            const newCart = user.cart.filter( cartItem => cartItem.title !== title );
            user.cart = newCart;
        }
        else { user.cart=[]; }
        user.save();
        res.status(200).send(`product with title ${title} successfully removed`)
    } catch (error) {
        next(error);
    }
})

// update quatity of cart product
userRouter.patch('/cart', async (req, res, next)=>{
    try {
        const { email, title, quantity } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        const newCart = user.cart.map( cartItem =>{
            if(cartItem.title === title) {cartItem.quantity = quantity}
            return cartItem;   
        });
        user.cart = [];
        user.cart = newCart.filter(()=>true);
        user.save();
        res.status(200).send(`quantity of product with title ${title} was set to ${quantity}`)
    } catch (error) {
        next(error);
    }
})

// update user info in profile
userRouter.patch('/profile', async (req, res, next)=>{
    try {
        const { email, name, password, photo } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        if(name){await userModel.findOneAndUpdate({email},{name})}
        if(password){
            const hashedPassword = await hashPassword(password);
            await userModel.findOneAndUpdate({email},{password:hashedPassword})
        }
        // photo remained unhandled ?????????????
        if(photo){}
        res.status(200).send("user info updated successfully");
    } catch (error) {
        next(error);
    }
})

/////////////////////////////////////////// ONLY ADMIN CRUD /////////////////////////////////////////

// get all users
// get one user by email
userRouter.get('/', async (req, res, next)=>{
    try {
        const { email } = req.body;
        if (email) {
            const user = await userModel.findOne({email});
            res.status(200).send(user);
        } else {
            const allUsers = await userModel.find();
            res.status(200).send(allUsers);
        }
    } catch (error) {
        next(error);
    }
})

// delete all users
// delete one user by email
userRouter.delete('/', async (req, res, next)=>{
    try {
        const { email } = req.body;
        if(email){
            await userModel.deleteOne({email});
        }
        else{
            await userModel.deleteMany();
        }
        res.status(200).send("deleted successfully");
    } catch (error) {
        next(error);
    }
})

// delete all user orders
// delete one user order by id
userRouter.delete('/orders', async (req, res, next)=>{
    try {
        const { email, orderID } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        if(orderID){
            const newOrders = user.order.filter( order => order.orderID !== +orderID);
            user.order = [];
            user.order = newOrders.filter(()=>true);
        } 
        else{
            user.order = [];
        }
        user.save();
        res.status(200).send("orders deleted successfully");
    } catch (error) {
        next(error);
    }
})

// update order status
userRouter.patch('/orders', async (req, res, next)=>{
    try {
        const { email, orderID, status } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        const newOrders = user.order.map( eachOrder => {
            if(eachOrder.orderID === orderID){eachOrder.status = status}
            return eachOrder;
        })
        user.order = [];
        user.order = newOrders.filter(()=>true);
        user.save();
        res.status(200).send("order status updated successfully");
    } catch (error) {
        next(error);
    }
})

module.exports = userRouter;