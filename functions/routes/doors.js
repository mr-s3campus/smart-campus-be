import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
import QRCode from "qrcode";
import { PassThrough } from "stream";
import { getMessaging } from "firebase-admin/messaging";
import { verifyToken } from "../middleware/authentication.js";
var router = express.Router();

const generateOtp = () => {
  // 6 digits OTP
  return Math.floor(100000 + Math.random() * 900000);
};

const sendFCM = (token, doorId) => {
  const message = {
    data: {
      doorId: doorId,
      body: "door " + doorId + " opened successfully!",
    },
    token: token,
  };
  // Send a message to the device corresponding to the provided
  // registration token.
  getMessaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      // console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

/* GET */
router.get("/", async function (req, res, next) {
  try {
    if (req?.query?.door) {
      const otp = generateOtp();
      const db = await makeDb(config);
      await withTransaction(db, async () => {
        let sql =
          "INSERT INTO DoorOpening VALUES (null, ?, UTC_TIMESTAMP(), ?, false, null); ";
        await db.query(sql, [req?.query?.door, otp]).catch((err) => {
          throw err;
        });

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
      res.status(404).send("door not specified!");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

/* GET */
router.post("/open", async function (req, res, next) {
  try {
    verifyToken(req, res, async () => {
      const userId = req.decodedUID;
      const { doorId, otp } = req.body;
      if (doorId && otp) {
        const db = await makeDb(config);
        await withTransaction(db, async () => {
          let sql =
            "UPDATE DoorOpening SET opened = true, userId = ?, openedAt = UTC_TIMESTAMP() " +
            "WHERE doorId = ? " +
            "AND otp = ? " +
            "AND opened = false " +
            "AND (SELECT permissionLevel FROM Door WHERE id = ? ) <= (SELECT userRole FROM S3User WHERE uid = ? ) = true " +
            "AND DATE_ADD(createdAt, INTERVAL '5' MINUTE) > UTC_TIMESTAMP() ; " +
            "SELECT pushToken FROM Door WHERE id = ? ; ";
          let results = await db
            .query(sql, [userId, doorId, otp, doorId, userId, doorId])
            .catch((err) => {
              throw err;
            });

          if (results[0].affectedRows === 0) {
            res.status(403).send();
          } else {
            const pushToken = results[1][0].pushToken;
            if (pushToken) {
              sendFCM(pushToken, doorId);
              res.status(200).send("door " + doorId + " opened successfully!");
            } else {
              res.status(500).send("can't contact the door!");
            }
          }
        });
      } else {
        res.status(404).send("no data");
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

/* GET */
router.post("/register", async function (req, res, next) {
  try {
    verifyToken(req, res, async () => {
      if (req.decodedEMAIL === "doors@doors.com") {
        const { pushToken, doorId } = req.body;
        const db = await makeDb(config);
        await withTransaction(db, async () => {
          let sql = "UPDATE Door SET pushToken = ? WHERE id = ? ;";
          let results = await db
            .query(sql, [pushToken, doorId])
            .catch((err) => {
              throw err;
            });

          res.status(200).send();
        });
      } else {
        res.status(401).send("user not authorized");
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

export default router;
