Meeting Manager

// Already Added User
UID-20550
"name":"ved",
"email":"ved@meet.com"

**************APIS DETAILS**************

Add User                                            (/api/add-user)

Get all available slots for a specific day          (/api/available-slots)
Schedule meeting in the given slot.                 (/api/schedule-meeting)
Reschedule meeting to a given slot.                 (/api/reschedule-meeting)
Cancel meeting if the meeting has not started       (/api/cancel-meeting)
Bulk update all meetings                            (/api/bulk-meeting)
Bulk cancel all meetings                            (/api/bulk-meeting)

**************APIS CURLS**************

//ADD USER

curl -X POST \
  'http://localhost:9080/api/add-user' \
  --header 'Accept: */*' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "name":"ved",
  "email":"ved@meet.com"
}'

//CHECK_AVAILABLE_SLOTS

curl -X GET \
  'http://localhost:9080/api/available-slots/UID-20550/15-03-2023' \
  --header 'Accept: */*' \
  --header 'User-Agent: Thunder Client (https://www.thunderclient.com)'

//SCHEDULE_MEETING

curl -X POST \
  'http://localhost:9080/api/schedule-meeting' \
  --header 'Accept: */*' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "participants": [
    "ajey@gmail.com",
    "nitish@gmail.com"
  ],
  "timings": "10:30-11:00",
  "userId": "UID-20550",
  "date": "15-03-2023"
}'

//RESCHEDULE_MEETING

curl -X POST \
  'http://localhost:9080/api/reschedule-meeting' \
  --header 'Accept: */*' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "currentTimings": "09:00-13:00",
  "userId": "UID-20550",
  "currentDate": "15-03-2023",
  "newTimings": "13:00-18:00",
  "newDate": "15-03-2023"
}'

//CANCEL_MEETING

curl -X POST \
  'localhost:9080/api/cancel-meeting' \
  --header 'Accept: */*' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "meetingId": "MID-76752",
  "userId": "UID-20550"
}'

//BULK_UPDATE

curl -X POST \
  'http://localhost:9080/api/bulk-meeting' \
  --header 'Accept: */*' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "data": [
    {
      "currentTimings": "09:00-09:30",
      "userId": "UID-20550",
      "currentDate": "15-03-2023",
      "newTimings": "09:00-09:30",
      "newDate": "16-03-2023"
    },
    {
      "currentTimings": "09:30-10:00",
      "userId": "UID-20550",
      "currentDate": "15-03-2023",
      "newTimings": "09:30-10:00",
      "newDate": "16-03-2023"
    },
    {
      "currentTimings": "10:00-10:30",
      "userId": "UID-20550",
      "currentDate": "15-03-2023",
      "newTimings": "10:00-10:30",
      "newDate": "16-03-2023"
    },
    {
      "currentTimings": "10:30-11:00",
      "userId": "UID-20550",
      "currentDate": "15-03-2023",
      "newTimings": "10:30-11:00",
      "newDate": "16-03-2023"
    }
  ],
  "type": "update"
}'

//BULK_CANCEL

curl -X POST \
  'http://localhost:9080/api/bulk-meeting' \
  --header 'Accept: */*' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "data": [
   "MID-44355",
   "MID-17495",
   "MID-68180",
   "MID-68366"
  ],
  "type": "cancel"
}'
