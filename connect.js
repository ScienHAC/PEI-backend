const mongoose = require("mongoose");

mongoose.set("strictQuery", true);  // Enable strict query mode

async function connectToMongoDB(MONGO_URI) {
    try {
        await mongoose.connect(MONGO_URI, {
            serverApi: {
                version: "1",  // Server API version (if needed)
                strict: true,   // Strict server behavior
                deprecationErrors: true,  // Throw errors for deprecated features
            },
            dbName: "PEI",
        });
        console.log("Connected successfully to MongoDB!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

module.exports = {
    connectToMongoDB,
};
