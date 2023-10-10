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

/* GET request to open */
router.get("/", async function (req, res, next) {
  try {
    if (req?.query?.door) {
      const otp = generateOtp();
      const db = await makeDb(config);
      await withTransaction(db, async () => {
        let sql =
          "INSERT INTO PlaceToken VALUES (?, ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL '5' MINUTE), null); ";
        await db.query(sql, [otp, req?.query?.door]).catch((err) => {
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

/* POST open */
router.post("/open", async function (req, res, next) {
  try {
    verifyToken(req, res, async () => {
      const userId = req.decodedUID;
      const { doorId, otp } = req.body;
      if (doorId && otp) {
        const db = await makeDb(config);
        await withTransaction(db, async () => {
          let sql = `
            INSERT INTO PlaceAccess VALUES( 
              UUID(), 
              ?, 
              ?,
              EXISTS (SELECT * 
              FROM PlaceToken 
              WHERE otp = ?
              AND placeId = ?
              AND expireAt > UTC_TIMESTAMP())
              
              AND 
              
              (EXISTS (SELECT *
              FROM S3User U, PlaceAuthorization PA
              WHERE U.uid = PA.userId
              AND U.uid = ?
              AND PA.placeId = ? )
            
              OR 
                
              (SELECT P.permissionLevel <= U.userRole
              FROM Place P, S3User U
              WHERE U.uid = ?
              AND p.id = ? )),
              
              UTC_TIMESTAMP()
            ) ; 

            SELECT (
              EXISTS (SELECT * 
              FROM PlaceToken 
              WHERE otp = ?
              AND placeId = ?
              AND expireAt > UTC_TIMESTAMP())
              
              AND 
              
              (EXISTS (SELECT *
              FROM S3User U, PlaceAuthorization PA
              WHERE U.uid = PA.userId
              AND U.uid = ?
              AND PA.placeId = ? )
            
              OR 
                
              (SELECT P.permissionLevel <= U.userRole
              FROM Place P, S3User U
              WHERE U.uid = ?
              AND p.id = ? ))
            ) as opened ;

            SELECT pushToken FROM Place WHERE id = ? ; 
            `;
          let values = [
            // insert
            otp,
            doorId,
            otp,
            doorId,
            userId,
            doorId,
            userId,
            doorId,
            // select
            otp,
            doorId,
            userId,
            doorId,
            userId,
            doorId,
            // select
            doorId,
          ];
          let results = await db.query(sql, values).catch((err) => {
            throw err;
          });

          if (results[1][0]?.opened) {
            const pushToken = results[2][0]?.pushToken;
            if (pushToken) {
              sendFCM(pushToken, doorId);
              res.status(200).send("door " + doorId + " opened successfully!");
            } else {
              res.status(500).send("can't contact the door!");
            }
          } else {
            res.status(403).send();
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

/* POST register door and push token */
router.post("/register", async function (req, res, next) {
  try {
    verifyToken(req, res, async () => {
      if (req.decodedEMAIL === "doors@doors.com") {
        const { pushToken, doorId } = req.body;
        const db = await makeDb(config);
        await withTransaction(db, async () => {
          let sql = "UPDATE Place SET pushToken = ? WHERE id = ? ;";
          await db.query(sql, [pushToken, doorId]).catch((err) => {
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

/* GET all doors */
router.get("/all", async function (req, res, next) {
  try {
    const db = await makeDb(config);
    await withTransaction(db, async () => {
      let sql = "SELECT * FROM Place ORDER BY title DESC; ";
      let results = await db.query(sql, []).catch((err) => {
        throw err;
      });

      res.status(200).send(results);
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

export default router;
