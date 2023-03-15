require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const apiRoutes = require("./routes");

const port = process.env.PORT;
const mongoDbUri = process.env.MONGO_DB_URI;

mongoose.connect(mongoDbUri);
const dbConnection = mongoose.connection;

dbConnection.on("error", (error) => {
    console.log("Error while connecting to DB", error);
});

dbConnection.once("open", async () => {
    console.log(`Connected to :`, mongoDbUri);
    const app = express();

    app.use(express.json());

    app.use("/api", apiRoutes(app));
    app.use((req, res) => {
        res.status(404).json({ status: "failure", message: "Path not found, Please provide proper route" });
    });
    app.listen(port, () => {
        console.log(`Server running at port ${port}`);
    });
});
