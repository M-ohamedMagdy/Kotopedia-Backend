const express = require('express');
const {hashPassword, comparePassword, createToken, verifyToken, photoUpdateMW} = require('../helpers/userHelper');
const {userModel, orderModel} = require('../models/userModel');
const productModel = require('../models/productModel');
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
        const user = await userModel.findOne({_id:userID});
        if(!user) throw customError(404, 'can not find any data for this user');
        const { title, unitPrice, category, image } = await productModel.findOne({_id:bookID});
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
        const { userID, bookID } = req.body;
        const user = await userModel.findOne({_id:userID});
        if(!user) throw customError(404, 'can not find any data for this user');
        const d = new Date();
        const date = `${d.getDate()}/${(d.getMonth())+1}/${d.getFullYear()}`;
        if(bookID){
            const {title,unitPrice,category,image} = await productModel.findOne({_id:bookID});
            await orderModel.create({email:user.email, userID, date, productsInOrder:{title, quantity:1, unitPrice, category, image}});
            res.status(200).send(`item with id ${bookID} is ordered successfully`);
        }
        else{
            const productsInOrder = user.cart.filter(()=>true);
            if(!productsInOrder) res.status(404).send("The cart is empty");
            await orderModel.create({email:user.email, userID, date, productsInOrder});
            res.status(200).send("all cart items added successfully to as user order");
        }
    } catch (error) {
        next(error);
    }
})


//////////////////////////////////////// User get requests ////////////////////////////////////////


// get all products
userRouter.get('/products', async (req, res, next)=>{
    try {
        const products = await productModel.find();
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
})

// get products by category
userRouter.get('/products/:category', async (req, res, next)=>{
    try {
        const { category } = req.params;
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
        const userOrders = await orderModel.find({userID:id});
        if(!userOrders) res.status(200).send("This user has no orders");
        res.status(200).json({userCart:userOrders});
    } catch (error) {
        next(error);
    }
})


//////////////////////////////////////// User patch requests ////////////////////////////////////////


// update quatity of cart product
userRouter.patch('/cart', async (req, res, next)=>{
    try {
        const { userID, title, quantity } = req.body;
        const user = await userModel.findOne({_id:userID});
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
userRouter.patch('/profile', photoUpdateMW, async (req, res, next)=>{
    try {
        const { id, email, name, gender, password } = req.body;
        const user = await userModel.findOne({_id:id});
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
        await userModel.findByIdAndUpdate(id,{email, name, gender});
        res.status(200).send("user info updated successfully");
    } catch (error) {
        next(error);
    }
})


//////////////////////////////////////// User delete requests ////////////////////////////////////////


// remove one product from  cart by title
userRouter.delete('/cart/:id/:title', async (req, res, next)=>{
    try {
        const { id, title } = req.params;
        const user = await userModel.findOne({_id:id});
        if(!user) throw customError(404, 'can not find any data for this user');
        const newCart = user.cart.filter( cartItem => cartItem.title !== title );
        user.cart = newCart;
        user.save();
        res.status(200).send(`product with title ${title} successfully removed`);
    } catch (error) {
        next(error);
    }
})

// empty user cart
userRouter.delete('/cart/:id', async (req, res, next)=>{
    try {
        const { id } = req.params;
        const user = await userModel.findOne({_id:id});
        if(!user) throw customError(404, 'can not find any data for this user');
        user.cart = [];
        user.save();
        res.status(200).send("cart is empty now")
    } catch (error) {
        next(error);
    }
})


// cancel an order
userRouter.delete('/orders/:orderID', async (req, res, next)=>{
    try {
        const { orderID } = req.params;
        const order = await orderModel.findOne({_id:orderID});
        if(order.status !== 'pending') res.status(405).send(`can not cancel this order after status has been updated to ${order.status}`);
        await orderModel.deleteOne({_id:orderID});
        res.status(200).send("order deleted successfully");
    } catch (error) {
        next(error);
    }
})


/////////////////////////////////////////// ONLY ADMIN CRUD /////////////////////////////////////////

// // get all users
// // get one user by email
// userRouter.get('/users/:id', async (req, res, next)=>{
//     try {
//         const { id } = req.params;
//         if (id) {
//             const user = await userModel.findById(id);
//             res.status(200).send(user);
//         } else {
//             const allUsers = await userModel.find();
//             res.status(200).send(allUsers);
//         }
//     } catch (error) {
//         next(error);
//     }
// })


// // delete all users
// // delete one user by email
// userRouter.delete('/users', async (req, res, next)=>{
//     try {
//         const { id } = req.body;
//         if(id){
//             await userModel.deleteOne({_id:id});
//         }
//         else{
//             await userModel.deleteMany();
//         }
//         res.status(200).send("deleted successfully");
//     } catch (error) {
//         next(error);
//     }
// })


// // update order status
// userRouter.patch('/orders', async (req, res, next)=>{
//     try {
//         const { id, status } = req.body;
//         const order = await orderModel.findOne({_id:id});
//         if(order.status !== 'pending') res.stauts(200).send(`can not update status for this order`);
//         await orderModel.findByIdAndUpdate(id,{status});
//         res.status(200).send(`order status successfully updated to ${status}`);
//     } catch (error) {
//         next(error);
//     }
// })



module.exports = userRouter;