const express = require('express');
const cookieParser = require('cookie-parser');
const userRoute = require('./Routes/user');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors({
    origin: process.env.Client_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use("/auth", userRoute);
const { connectToMongoDB } = require("./connect");
connectToMongoDB(process.env.MONGODB_URI)
app.get('/', (req, res) => {
    res.json({ message: 'hello world' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server is running on port 5000');
});
