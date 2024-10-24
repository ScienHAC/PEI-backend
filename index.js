const express = require('express');
const cookieParser = require('cookie-parser');
const userRoute = require('./Routes/user');
const fileRoute = require('./Routes/fileRoutes');
const researchRoutes = require('./Routes/Research');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors({
    origin: process.env.Client_URL,
    credentials: true
}));
app.use("/api/uploads/pdf", express.static("uploads/pdf"));
app.use("/api/uploads/thumbnails", express.static("thumbnail"));
app.use(cookieParser());
app.use(express.json());
app.use("/auth", userRoute);
app.use("/api", fileRoute);
app.use('/api', researchRoutes);
const { connectToMongoDB } = require("./connect");
connectToMongoDB(process.env.MONGODB_URI)
app.get('/', (req, res) => {
    res.json({ message: 'hello world' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server is running on port 5000');
});
