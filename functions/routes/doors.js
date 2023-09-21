import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
import QRCode from "qrcode";
import { PassThrough } from "stream";
import { getMessaging } from "firebase-admin/messaging";
var router = express.Router();

const generateOtp = () => {
  // 6 digits OTP
  return Math.floor(100000 + Math.random() * 900000);
};

const FCM_TOKEN =
  "etGgGaJsRO6rqHmuGddH0L:APA91bG7ychh913fw-bdJo6tl_-4bDXXwFBgzbFWBKTyysYaZtM9aX6p-f-IAGjmY9MnKyi7RVic6k1eE3IZifg3RVxStXZLPkWAZVDwDD7opHa1xw9Mh8q3M5qAWLMQPRMgsKdWx2lK";

const sendFCM = (token) => {
  const message = {
    data: {
      body: "door opened from server successfully!",
    },
    token: token,
  };
  // Send a message to the device corresponding to the provided
  // registration token.
  getMessaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};


// /* GET */
// router.get("/openDoor", async function (req, res, next) {
//   try {
//     console.log()
//     sendFCM(FCM_TOKEN)
//     res.status(200).send("ok")
//   } catch (err) {
//     console.log(err);
//     res.status(500).send("internal error");
//   }
// });

/* GET */
router.get("/", async function (req, res, next) {
  try {
    if (req?.query?.door) {
      const userId = "user-id";
      // FIX ME: verify user privileges
      const otp = generateOtp();
      const db = await makeDb(config);
      await withTransaction(db, async () => {
        let sql =
          "INSERT INTO DoorOpening VALUES (?, ?, UTC_TIMESTAMP(), ?, false, null); ";
        await db.query(sql, [userId, req?.query?.door, otp]).catch((err) => {
          throw err;
        });

        console.log("db ok - otp: ", otp);

        const content = otp.toString();
        const qrStream = new PassThrough();
        const result = await QRCode.toFileStream(qrStream, content, {
          type: "png",
          width: 512,
          errorCorrectionLevel: "H",
        });

        qrStream.pipe(res);
      });
    } else {
      res.status(404).send("door not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

/* GET */
router.post("/open", async function (req, res, next) {
  try {
    const userId = "user-id";
    const { doorId, otp } = req.body;
    if (doorId && otp) {
      const db = await makeDb(config);
      await withTransaction(db, async () => {
        let sql =
          "UPDATE DoorOpening SET opened = true, openedAt = UTC_TIMESTAMP() " +
          "WHERE userId = ? " +
          "AND doorId = ? " +
          "AND otp = ? " +
          "AND opened = false " +
          "AND DATE_ADD(createdAt, INTERVAL '5' MINUTE) > UTC_TIMESTAMP();";
        let results = await db
          .query(sql, [userId, doorId, otp])
          .catch((err) => {
            throw err;
          });

        if (results.affectedRows === 0) {
          res.status(403).send();
        } else {
          sendFCM(FCM_TOKEN)
          res.status(200).send("door " + doorId + " opened successfully!");
        }
      });
    } else {
      res.status(404).send("no data");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

export default router;
