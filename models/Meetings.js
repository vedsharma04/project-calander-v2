const mongoose = require("mongoose");

const schema = new mongoose.Schema(
    {
        meetingId: String,
        startTime: Date,
        endTime: Date,
        participants: [],
        isCancelled: Boolean,
        isRescheduled: Boolean,
    },
    {
        collection: "meetings",
        timestamps: true,
    }
);

module.exports = mongoose.model("Meetings", schema);
