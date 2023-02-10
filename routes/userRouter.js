const express = require('express');
const {hashPassword, comparePassword, createToken, verifyToken} = require('../helpers/userHelper');
const userModel = require('../models/userModel');
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
        const { email, title, quantity, unitPrice } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        user.cart.push({title, quantity, unitPrice});
        user.save();
        res.status(200).send("product successfully added to cart"/*+"\n"+user*/);
    } catch (error) {
        next(error);
    }
})

// add order for user from his cart
// userRouter.post('/orders', async (req, res, next)=>{
//     try {
//         const { email } = req.body;
//         const user = await userModel.findOne({email});

//         res.status(200).send("order successfully added to user"+"\n"+user);
//     } catch (error) {
//         next(error);
//     }
// })

// to get one user info for profile page
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

// to get products for user cart
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

// to get user orders
userRouter.get('/orders', async (req, res, next)=>{
    try {
        const { email } = req.body;
        const user = await userModel.findOne({email});
        if(!user) throw customError(404, 'can not find any data for this user');
        res.status(200).send(user.orders);
    } catch (error) {
        next(error);
    }
})

// to empty user cart
// to remove product from  cart
userRouter.delete('/cart', async (req, res, next)=>{
    try {
        const { email, title } = req.body;
        const user = await userModel.findOne({email});
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


// to change quatity of cart product
userRouter.patch('/cart', async (req, res, next)=>{
    try {
        const { email, title, quantity } = req.body;
        const user = await userModel.findOne({email});
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









/*FOR DEVELOPMENT ONLY*/

userRouter.get('/', async (req, res, next)=>{
    try {
        const allUsers = await userModel.find({});
        res.status(200).send(allUsers);
    } catch (error) {
        next(error);
    }
})
userRouter.delete('/', async (req, res, next)=>{
    try {
        await userModel.deleteMany();
        res.status(200).send("deleted all data successfully");
    } catch (error) {
        next(error);
    }
})


module.exports = userRouter;