const moment = require("moment");

const slotTimes = {
    1: ["09:00", "09:30"],
    2: ["09:30", "10:00"],
    3: ["10:00", "10:30"],
    4: ["10:30", "11:00"],
    5: ["11:00", "11:30"],
    6: ["11:30", "12:00"],
    7: ["12:00", "12:30"],
    8: ["12:30", "13:00"],
    9: ["13:00", "13:30"],
    10: ["13:30", "14:00"],
    11: ["14:00", "14:30"],
    12: ["14:30", "15:00"],
    13: ["15:00", "15:30"],
    14: ["15:30", "16:00"],
    15: ["16:00", "16:30"],
    16: ["16:30", "17:00"],
    17: ["17:00", "17:30"],
    18: ["17:30", "18:00"],
};

function getSlotNumber(startTime, endTime, slotTimes) {
    const slots = [];

    for (const slotNumber in slotTimes) {
        const slotStart = slotTimes[slotNumber][0];
        const slotEnd = slotTimes[slotNumber][1];

        if (startTime >= slotStart && endTime <= slotEnd) {
            slots.push(parseInt(slotNumber));
        } else if (startTime < slotEnd && endTime > slotStart) {
            slots.push(parseInt(slotNumber));
        }
    }

    return slots;
}

const getSlotNoFromTimings = (timing) => {
    let result = /\d\d:\d\d-\d\d:\d\d/g.test(timing);
    if (result) {
        const startTime = moment(timing.split("-")[0], "HH:mm");
        const endTime = moment(timing.split("-")[1], "HH:mm");

        if (startTime.isSameOrAfter(moment("09:00", "HH:mm")) && endTime.isSameOrBefore(moment("18:00", "HH:mm"))) {
            if ((startTime.minutes() === 0 || startTime.minutes() === 30) && (endTime.minutes() === 0 || endTime.minutes() === 30)) {
                const duration = moment.duration(endTime.diff(startTime)).asMinutes();
                if (duration <= 0) {
                    console.log("incorrect time duration");
                    throw "incorrect time duration";
                } else {
                    return getSlotNumber(timing.split("-")[0], timing.split("-")[1], slotTimes);
                }
            } else {
                console.log("incorrect time slot, time should be in 30 min interval");
                throw "incorrect time slot , time should be in 30 min interval";
            }
        } else {
            console.log("time provided is out of range");
            throw "time provided is out of range";
        }
    } else {
        console.log("Timing format incorrect");
        throw "Timing format incorrect";
    }
};

const getTimingfromSlotNo = (slotNo,day) => {
    timings = slotTimes[slotNo];
    return {
        startTime: moment.utc(timings[0], "HH:mm").set(day).toDate(),
        endTime: moment.utc(timings[1], "HH:mm").set(day).toDate(),
    };
};

module.exports = {
    getSlotNoFromTimings,
    getTimingfromSlotNo,
};
