const mongoose = require("mongoose");

const schema = new mongoose.Schema(
    {
        userId: {
            type: String,
            unique: true,
        },
        name: String,
        email: String,
    },
    {
        collection: "users",
        timestamps: true,
    }
);

module.exports = mongoose.model("Users", schema);
