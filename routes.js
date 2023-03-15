const { Router } = require("express");
const apiRouter = Router();

const { addUser,availableSlots, scheduleMeeting, rescheduleMeeting, cancelMeeting, bulkMeeting } = require("./services");
module.exports = () => {
    return apiRouter
        .post('/add-user',addUser)
        .get("/available-slots/:userId/:date", availableSlots)
        .post("/schedule-meeting", scheduleMeeting)
        .post("/reschedule-meeting", rescheduleMeeting)
        .post("/cancel-meeting", cancelMeeting)
        .post("/bulk-meeting", bulkMeeting);
};
