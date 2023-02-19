const express = require('express');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
require('dotenv').config(); 

const app = express();
const cors = require('cors');      
const port = 3000;

app.use(cors());

app.use(express.json());

app.use('/customer', userRouter);
app.use('/admin', adminRouter);

app.use((error,req,res,next) => res.status(error.statusCode || 500).send(error.message))

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});