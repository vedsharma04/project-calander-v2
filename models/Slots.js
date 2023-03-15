const mongoose = require("mongoose");

const schema = new mongoose.Schema(
    {
        slotNo: Number,
        userId: String,
        day: Date,
        meetingId: String,
        isAvailable: Boolean,
    },
    {
        collection: "slots",
        timestamps: true,
    }
);

module.exports = mongoose.model("Slots", schema);
