const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

async function connectToMongoDB(MONGO_URI) {
    try {
        await mongoose.connect(MONGO_URI, {
            serverApi: {
                version: "1",
                strict: true,
                deprecationErrors: true,
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
