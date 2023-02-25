const express = require('express');
const {hashPassword, comparePassword, createToken, verifyToken, photoUpdateMW} = require('../helpers/userHelper');
const {productModel, feedBackModel} = require('../models/productModel');
const {userModel, orderModel} = require('../models/userModel');
const userValidationMW = require('../helpers/dataValidation');
const customError = require('../helpers/customError');
const cloud = require('../cloudinaryConfig'); 
const fs = require('fs');

const userRouter = express.Router();

const cors = require('cors');
const app = express();       
app.use(cors());


//////////////////////////////////////// User post requests ////////////////////////////////////////


// add new user (signup)
userRouter.post('/signup', userValidationMW, photoUpdateMW, async (req, res, next)=>{
    try {
        const { name, email, password, gender } = req.body;
        if(req.file){
            const result = await cloud.uploads(req.file.path);
            photo = result.url;
        }
        const hashedPassword = await hashPassword(password);
        const newUser = await userModel.create({name, email, password : hashedPassword, gender, photo});
        fs.unlinkSync(req.file.path);
        res.status(200).json(newUser);
    } catch (error) {
        next(error);
    }
})

// login for existing user
userRouter.post('/login', async (req, res, next)=>{
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(401,'Invalid email or password');
        const result = await comparePassword(password, user.password);
        if(!result){throw customError(401, 'Invalid email or password')};
        const token = await createToken(user.id);
        res.status(200).json({token, user});
    } catch (error) {
        next(error);
    }
})

// add product to cart
userRouter.post('/cart', async (req, res, next)=>{
    try {
        const { userID, bookID } = req.body;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== userID ) throw customError(401, "Unauthorized Action");
        const user = await userModel.findOne({_id:userID});
        if(!user) throw customError(404, 'can not find any data for this user');
        const { title, unitPrice, category, photo } = await productModel.findOne({_id:bookID});
        user.cart.push({title, quantity:1, unitPrice, category, photo});
        user.save();
        res.status(200).json("product successfully added to cart");
    } catch (error) {
        next(error);
    }
})

// add order to buy one item
// add order for user ( all cart )
userRouter.post('/orders', async (req, res, next)=>{
    try {
        const { userID, bookID } = req.body;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== userID ) throw customError(401, "Unauthorized Action");
        const user = await userModel.findOne({_id:userID});
        if(!user) throw customError(404, 'can not find any data for this user');
        const d = new Date();
        const date = `${d.getDate()}/${(d.getMonth())+1}/${d.getFullYear()}`;
        if(bookID){
            const {title,unitPrice,category,photo} = await productModel.findOne({_id:bookID});
            await orderModel.create({email:user.email, userID, date, totalPrice:unitPrice , productsInOrder:{title, quantity:1, unitPrice, category, photo}});
            res.status(200).json(`item with id ${bookID} is ordered successfully`);
        }
        else{
            const productsInOrder = user.cart.filter(()=>true);
            if(!productsInOrder) res.status(404).send("The cart is empty");
            let totalPrice = 0;
            productsInOrder.forEach( ele => totalPrice += (ele.quantity*ele.unitPrice));
            await orderModel.create({email:user.email, userID, date, totalPrice, productsInOrder});
            res.status(200).json("all cart items added successfully to as user order");
        }
    } catch (error) {
        next(error);
    }
})


// add feedback to product
userRouter.post('/feedbacks', async (req, res, next)=>{
    try {
        const { title, email, body } = req.body;
        const d = new Date();
        const date = `${d.getDate()}/${(d.getMonth())+1}/${d.getFullYear()}`;
        await feedBackModel.create({ title, email, body, date });
        res.status(200).json("feedback submitted successfully");
    } catch (error) {
        next(error);
    }
})


//////////////////////////////////////// User get requests ////////////////////////////////////////

// get all products
// get one product by title
userRouter.get('/products/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        const { title } = req.query;
        if(title){
            const product = await productModel.findOne({title});
            if(!product) throw customError(404, `No Book found with title : ${title}`)
            res.status(200).json(product);
        }
        else{
            const products = await productModel.find();
            res.status(200).json(products);
        }
    } catch (error) {
        next(error);
    }
})

// get products by category
userRouter.get('/products/:category/:id', async (req, res, next)=>{
    try {
        const { id, category } = req.params;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        const categoryProducts = await productModel.find({category});
        res.status(200).json(categoryProducts);
    } catch (error) {
        next(error);
    }
})

// get one user info for profile page
userRouter.get('/profile/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        const user = await userModel.findOne({_id:id});
        if(!user) throw customError(404, 'can not find any data for this user');
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
})

// get all products in cart
userRouter.get('/cart/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        const user = await userModel.findOne({_id:id});
        if(!user) throw customError(404, 'can not find any data for this user');
        res.status(200).json({userCart:user.cart});
    } catch (error) {
        next(error);
    }
})

// get all user orders
userRouter.get('/orders/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        const userOrders = await orderModel.find({userID:id});
        if(!userOrders) res.status(200).send("This user has no orders");
        res.status(200).json({userOrders});
    } catch (error) {
        next(error);
    }
})

//get feedbacks of one product
userRouter.get('/feedbacks/:title', async(req, res, next)=>{
    try {
        const { title } = req.params;
        const feedbacks = await feedBackModel.find({title});
        if(!feedbacks) throw customError(404, "No feedbacks found");
        res.status(200).json(feedbacks);
    } catch (error) {
        next(error);
    }
})


//////////////////////////////////////// User patch requests ////////////////////////////////////////


// update quatity of cart product
userRouter.patch('/cart', async (req, res, next)=>{
    try {
        const { userID, title, quantity } = req.body;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== userID ) throw customError(401, "Unauthorized Action");
        const user = await userModel.findOne({_id:userID});
        if(!user) throw customError(404, 'can not find any data for this user');
        const newCart = user.cart.map( cartItem =>{
            if(cartItem.title === title) {cartItem.quantity = quantity}
            return cartItem;   
        });
        user.cart = [];
        user.cart = newCart.filter(()=>true);
        user.save();
        res.status(200).json(`quantity of product with title ${title} was set to ${quantity}`)
    } catch (error) {
        next(error);
    }
})

// update user info in profile
userRouter.patch('/profile', photoUpdateMW, async (req, res, next)=>{
    try {
        const { id, email, name, gender, password } = req.body;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        let user = await userModel.findById(id);
        if(!user) throw customError(404, 'can not find any data for this user');
        if(req.file){
            const result = await cloud.uploads(req.file.path);
            const photo = result.url;
            await userModel.findByIdAndUpdate(id,{photo});
            fs.unlinkSync(req.file.path);
        }
        if(password){
            const hashedPassword = await hashPassword(password);
            await userModel.findByIdAndUpdate(id,{password:hashedPassword});
        }
        if(email) await userModel.findByIdAndUpdate(id,{email})
        if(name) await userModel.findByIdAndUpdate(id,{email})
        if(gender) await userModel.findByIdAndUpdate(id,{gender})
        user = await userModel.findById(id);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
})


//////////////////////////////////////// User delete requests ////////////////////////////////////////


// remove one product from  cart by title
userRouter.delete('/cart/:id/:title', async (req, res, next)=>{
    try {
        const { id, title } = req.params;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        const user = await userModel.findOne({_id:id});
        if(!user) throw customError(404, 'can not find any data for this user');
        const newCart = user.cart.filter( cartItem => cartItem.title !== title );
        user.cart = newCart;
        user.save();
        res.status(200).json(`product with title ${title} successfully removed`);
    } catch (error) {
        next(error);
    }
})

// empty user cart
userRouter.delete('/cart/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        const user = await userModel.findOne({_id:id});
        if(!user) throw customError(404, 'can not find any data for this user');
        user.cart = [];
        user.save();
        res.status(200).json("cart is empty now")
    } catch (error) {
        next(error);
    }
})

// cancel an order
userRouter.delete('/orders/:id/:orderID', async (req, res, next)=>{
    try {
        const { id, orderID } = req.params;
        const { authorization: token } = req.headers;
        const payload = await verifyToken(token);
        if( payload.id !== id ) throw customError(401, "Unauthorized Action");
        const order = await orderModel.findOne({_id:orderID});
        if(order.status !== 'pending') res.status(405).send(`can not cancel this order after status has been updated to ${order.status}`);
        await orderModel.deleteOne({_id:orderID});
        res.status(200).json("order deleted successfully");
    } catch (error) {
        next(error);
    }
})

module.exports = userRouter;