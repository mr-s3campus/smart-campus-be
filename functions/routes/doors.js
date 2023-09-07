import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
import QRCode from "qrcode";
import { PassThrough } from "stream";
var router = express.Router();

const generateOtp = () => {
  // 6 digits OTP
  return Math.floor(100000 + Math.random() * 900000);
};

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
          width: 200,
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
