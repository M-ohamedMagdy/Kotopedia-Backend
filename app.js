const express = require('express');
const userRouter = require('./routes/userRouter');
const productRouter = require('./routes/productRouter');
const app = express();
const port = 3000;

app.use(express.json());

app.use('/customer', userRouter);
app.use('/admin', productRouter);

app.use((error,req,res,next) => res.status(error.statusCode || 500).send(error.message))

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});