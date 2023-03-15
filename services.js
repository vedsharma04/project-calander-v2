const moment = require("moment");
const { isEmpty, some } = require("lodash");
const Promise = require("bluebird");

const { Users, Slots, Meetings } = require("./models");

const { getTimingfromSlotNo, getSlotNoFromTimings } = require("./convertor");

const addUser = async (req, res) => {
    const { name = "", email = "" } = req.body || {};
    try {
        if (isEmpty(name) || isEmpty(email)) {
            return res.status(400).json({ status: "failed", message: "incomplete details ,provide proper details" });
        }

        let userDetails = await Users.findOne({ email, name }).lean();
        if (!isEmpty(userDetails)) {
            return res.status(400).json({ status: "failed", message: `user already added with userId ${userDetails.userId}` });
        } else {
            userDetails = await Users.create({ email, name, userId: `UID-${Math.floor(Math.random() * 90000) + 10000}` });
            return res.status(200).json({ status: "success", message: `user added with userId ${userDetails.userId}` });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: "failed", message: "Error while calling api", errorMessage: error });
    }
};

const availableSlots = async (req, res) => {
    const { userId = "", date = "" } = req.params;
    try {
        if (isEmpty(userId) || isEmpty(date)) {
            return res.status(400).json({ status: "failed", message: "incomplete details ,provide proper details" });
        }

        let user = await Users.findOne({ userId }).lean();
        if (!isEmpty(user)) {
            let formattedDate = moment.utc(date, "DD-MM-YYYY").toDate();
            let slotsData = await Slots.find({ day: formattedDate, userId, isAvailable: false }, { slotNo: 1, _id: 0 }).lean();
            let day = {
                date: formattedDate.getUTCDate(),
                month: formattedDate.getUTCMonth() + 1,
                year: formattedDate.getUTCFullYear(),
            };
            let totalSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            let totalSlotsTiming = [];
            if (isEmpty(slotsData)) {
                totalSlots.map((ele) => totalSlotsTiming.push(getTimingfromSlotNo(ele, day)));
            } else {
                let availableSlots = totalSlots;
                slotsData.map((ele) => {
                    let pos = availableSlots.indexOf(ele.slotNo);
                    if (pos != -1) {
                        availableSlots.splice(pos, 1);
                    }
                });
                availableSlots.map((ele) => totalSlotsTiming.push(getTimingfromSlotNo(ele, day)));
            }
            return res.status(200).json({ status: "success", message: `user available slots with userId ${userId}`, data: { availableSlots: totalSlotsTiming } });
        } else {
            return res.status(400).json({ status: "failed", message: `user does not exist with userId ${userId}` });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: "failed", message: "Error while calling api", errorMessage: error });
    }
};

const scheduleMeeting = async (req, res) => {
    const { participants = [], timings = "", userId = "", date = "" } = req.body;

    try {
        if (isEmpty(userId) || isEmpty(date) || isEmpty(timings) || isEmpty(participants)) {
            return res.status(400).json({ status: "failed", message: "incomplete details ,provide proper details" });
        }

        let user = await Users.findOne({ userId }).lean();
        if (!isEmpty(user)) {
            const { email = "" } = user;
            if (!participants.includes(email)) {
                participants.push(email);
            }

            let meetingId = `MID-${Math.floor(Math.random() * 90000) + 10000}`;
            let formattedDate = moment.utc(date, "DD-MM-YYYY").toDate();
            let slotNos = getSlotNoFromTimings(timings);

            let slotsData = await Slots.find({ slotNo: { $in: slotNos }, isAvailable: false }, { slotNo: 1, _id: 0 }).lean();

            if (isEmpty(slotsData)) {
                let slotsToAdd = [];
                slotNos.map((ele) => {
                    slotsToAdd.push({
                        userId,
                        meetingId,
                        slotNo: ele,
                        day: formattedDate,
                        isAvailable: false,
                    });
                });

                await Slots.create(slotsToAdd);

                let day = {
                    date: formattedDate.getUTCDate(),
                    month: formattedDate.getUTCMonth() + 1,
                    year: formattedDate.getUTCFullYear(),
                };
                let startTime, endTime;

                if (slotNos.length == 1) {
                    let dates = getTimingfromSlotNo(slotNos[0], day);
                    startTime = dates.startTime;
                    endTime = dates.endTime;
                } else {
                    startTime = getTimingfromSlotNo(slotNos[0], day).startTime;
                    endTime = getTimingfromSlotNo(slotNos[slotNos.length - 1], day).endTime;
                }

                await Meetings.create({
                    meetingId,
                    participants,
                    startTime,
                    endTime,
                    isCancelled: false,
                    isRescheduled: false,
                });

                return res.status(200).json({ status: "success", message: `successfully meeting created with userId ${userId}`, data: { meetingId } });
            } else {
                return res.status(400).json({ status: "failed", message: `slot already booked for userId ${userId}` });
            }
        } else {
            return res.status(400).json({ status: "failed", message: `user does not exist with userId ${userId}` });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: "failed", message: "Error while calling api", errorMessage: error });
    }
};

const rescheduleMeeting = async (req, res) => {
    const { userId = "", currentTimings = "", currentDate = "", newTimings = "", newDate = "" } = req.body;
    try {
        if (isEmpty(userId) || isEmpty(currentTimings) || isEmpty(currentDate) || isEmpty(newTimings) || isEmpty(newDate)) {
            return res.status(400).json({ status: "failed", message: "incomplete details ,provide proper details" });
        }

        let user = await Users.findOne({ userId }).lean();
        if (!isEmpty(user)) {
            let currentFormattedDate = moment.utc(currentDate, "DD-MM-YYYY").toDate();
            let currentSlotNo = getSlotNoFromTimings(currentTimings);

            let currentSlotData = await Slots.find({ day: currentFormattedDate, userId, slotNo: { $in: currentSlotNo }, isAvailable: false }, { slotNo: 1, _id: 0, meetingId: 1 }).lean();
            if (isEmpty(currentSlotData)) {
                return res.status(400).json({ status: "failed", message: `incorrect meeting details for current date/timings for ${userId}` });
            }

            let newFormattedDate = moment.utc(newDate, "DD-MM-YYYY").toDate();
            let newSlotNo = getSlotNoFromTimings(newTimings);

            let newSlotData = await Slots.find({ day: newFormattedDate, userId, slotNo: { $in: newSlotNo }, isAvailable: false }, { slotNo: 1, _id: 0 }).lean();
            if (isEmpty(newSlotData)) {
                let alreadyCreatedUnutilizedSlots = await Slots.count({ day: newFormattedDate, userId, slotNo: { $in: newSlotNo }, isAvailable: true });
                if (alreadyCreatedUnutilizedSlots > 0) {
                    await Slots.deleteMany({ day: newFormattedDate, userId, slotNo: { $in: newSlotNo }, isAvailable: true });
                }
                const { meetingId = "" } = currentSlotData[0] || {};
                //make isAvailable true for old slots
                await Slots.updateMany({ meetingId }, { $set: { isAvailable: true } });
                //create new slots with same meeting Id
                let slotsToAdd = [];
                newSlotNo.map((ele) => {
                    slotsToAdd.push({
                        userId,
                        meetingId,
                        slotNo: ele,
                        day: newFormattedDate,
                        isAvailable: false,
                    });
                });
                await Slots.create(slotsToAdd);
                //update time in meetings

                let startTime, endTime;
                let day = {
                    date: newFormattedDate.getUTCDate(),
                    month: newFormattedDate.getUTCMonth() + 1,
                    year: newFormattedDate.getUTCFullYear(),
                };

                if (newSlotNo.length == 1) {
                    let dates = getTimingfromSlotNo(newSlotNo[0], day);
                    startTime = dates.startTime;
                    endTime = dates.endTime;
                } else {
                    startTime = getTimingfromSlotNo(newSlotNo[0], day).startTime;
                    endTime = getTimingfromSlotNo(newSlotNo[newSlotNo.length - 1], day).endTime;
                }
                await Meetings.updateOne({ meetingId }, { $set: { isRescheduled: true, startTime, endTime } });
                return res.status(200).json({ status: "success", message: `meeting rescheduled to new date/timings for userId ${userId}`, data: { meetingId } });
            } else {
                return res.status(400).json({ status: "failed", message: `new meeting date/timings is already booked for userId ${userId}` });
            }
        } else {
            return res.status(400).json({ status: "failed", message: `user does not exist with userId ${userId}` });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: "failed", message: "Error while calling api", errorMessage: error });
    }
};

const cancelMeeting = async (req, res) => {
    const { meetingId = "", userId = "" } = req.body;
    try {
        if (isEmpty(userId) || isEmpty(meetingId)) {
            return res.status(400).json({ status: "failed", message: "incomplete details ,provide proper details" });
        }

        let user = await Users.findOne({ userId }).lean();
        if (!isEmpty(user)) {
            let meeting = await Meetings.findOne({ meetingId }).lean();
            if (isEmpty(meeting)) {
                return res.status(400).json({ status: "failed", message: `meeting does not exist for userId ${userId}, meetingId ${meetingId}` });
            } else {
                await Meetings.updateOne({ meetingId }, { $set: { isCancelled: true } });
                await Slots.deleteMany({ userId, meetingId });

                return res.status(200).json({ status: "success", message: `meeting deleted for userId ${userId}` });
            }
        } else {
            return res.status(400).json({ status: "failed", message: `user does not exist with userId ${userId}` });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: "failed", message: "Error while calling api", errorMessage: error });
    }
};

const bulkMeeting = async (req, res) => {
    const { data = [], type = "" } = req.body;

    try {
        if (isEmpty(type) || isEmpty(data)) {
            return res.status(400).json({ status: "failed", message: "incomplete details ,provide proper details" });
        }

        if (type == "cancel") {
            let totalDeleted = [];
            await Promise.map(data, async (meetingId) => {
                let meeting = await Meetings.findOne({ meetingId }).lean();
                if (!isEmpty(meeting)) {
                    totalDeleted.push(meetingId);
                    await Meetings.updateOne({ meetingId }, { $set: { isCancelled: true } });
                    await Slots.deleteMany({ meetingId });
                }
            });

            return res.status(200).json({ status: "success", message: `bulk meetings deleted`, data: { totalDeleted } });
        } else if (type == "update") {
            let totalUpdatedResponse = {};

            await Promise.map(data, async (ele, idx) => {
                let summary = "";
                try {
                    const { userId = "", currentTimings = "", currentDate = "", newTimings = "", newDate = "" } = ele || {};
                    let isSkipped = false;

                    if (isEmpty(userId) || isEmpty(currentTimings) || isEmpty(currentDate) || isEmpty(newTimings) || isEmpty(newDate)) {
                        isSkipped = true;
                    }

                    if (!isSkipped) {
                        let user = await Users.findOne({ userId }).lean();
                        if (!isEmpty(user)) {
                            let currentFormattedDate = moment.utc(currentDate, "DD-MM-YYYY").toDate();
                            let currentSlotNo = getSlotNoFromTimings(currentTimings);

                            let currentSlotData = await Slots.find({ day: currentFormattedDate, userId, slotNo: { $in: currentSlotNo }, isAvailable: false }, { slotNo: 1, _id: 0, meetingId: 1 }).lean();
                            if (isEmpty(currentSlotData)) {
                                summary = `incorrect meeting details for current date/timings for ${userId}`;
                            }

                            let newFormattedDate = moment.utc(newDate, "DD-MM-YYYY").toDate();
                            let newSlotNo = getSlotNoFromTimings(newTimings);

                            let newSlotData = await Slots.find({ day: newFormattedDate, userId, slotNo: { $in: newSlotNo }, isAvailable: false }, { slotNo: 1, _id: 0 }).lean();
                            if (isEmpty(newSlotData)) {
                                let alreadyCreatedUnutilizedSlots = await Slots.count({ day: newFormattedDate, userId, slotNo: { $in: newSlotNo }, isAvailable: true });
                                if (alreadyCreatedUnutilizedSlots > 0) {
                                    await Slots.deleteMany({ day: newFormattedDate, userId, slotNo: { $in: newSlotNo }, isAvailable: true });
                                }
                                const { meetingId = "" } = currentSlotData[0] || {};
                                //make isAvailable true for old slots
                                await Slots.updateMany({ meetingId }, { $set: { isAvailable: true } });
                                //create new slots with same meeting Id
                                let slotsToAdd = [];
                                newSlotNo.map((ele) => {
                                    slotsToAdd.push({
                                        userId,
                                        meetingId,
                                        slotNo: ele,
                                        day: newFormattedDate,
                                        isAvailable: false,
                                    });
                                });
                                await Slots.create(slotsToAdd);
                                //update time in meetings

                                let startTime, endTime;
                                let day = {
                                    date: newFormattedDate.getUTCDate(),
                                    month: newFormattedDate.getUTCMonth() + 1,
                                    year: newFormattedDate.getUTCFullYear(),
                                };

                                if (newSlotNo.length == 1) {
                                    let dates = getTimingfromSlotNo(newSlotNo[0], day);
                                    startTime = dates.startTime;
                                    endTime = dates.endTime;
                                } else {
                                    startTime = getTimingfromSlotNo(newSlotNo[0], day).startTime;
                                    endTime = getTimingfromSlotNo(newSlotNo[newSlotNo.length - 1], day).endTime;
                                }
                                await Meetings.updateOne({ meetingId }, { $set: { isRescheduled: true, startTime, endTime } });
                                summary = `meeting rescheduled to new date/timings for userId ${userId}, meetingId ${meetingId}`;
                            } else {
                                summary = `new meeting date/timings is already booked for userId ${userId}`;
                            }
                        } else {
                            summary = `user does not exist with userId ${userId}`;
                        }
                    } else {
                        summary = "incomplete details";
                    }
                    totalUpdatedResponse[`Case-${idx + 1}`] = summary;
                } catch (error) {
                    console.log(error);
                    totalUpdatedResponse[`Case-${idx + 1}`] = error;
                }
            });
            return res.status(200).json({ status: "success", message: `bulk meetings updated`, data: { totalUpdatedResponse } });
        } else {
            return res.status(200).json({ status: "failed", message: `wrong type entered` });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: "failed", message: "Error while calling api", errorMessage: error.message });
    }
};
//type cancel data:[]
//type update data
/*
{
  "currentTimings": "09:00-13:00",
  "userId": "UID-20550",
  "currentDate": "15-03-2023",
  "newTimings": "13:00-18:00",
  "newDate": "15-03-2023"
}
*/

module.exports = {
    addUser,
    availableSlots,
    scheduleMeeting,
    rescheduleMeeting,
    cancelMeeting,
    bulkMeeting,
};
