import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
import { sendNotification } from "../middleware/notifications/sendNotification.js";
var router = express.Router();

/* GET / */
router.get("/", async function (req, res, next) {
  res.status(404).send();
});

/* GET all notifications received by user */
router.get("/all", async function (req, res, next) {
  try {
    const uid = req.decodedUID;
    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let sql =
        "SELECT * FROM Notification WHERE receiver_id = ? ORDER BY createdAt DESC; ";
      let results = await db.query(sql, [uid]).catch((err) => {
        throw err;
      });

      res.status(200).send(results);
    });
  } catch (err) {
    res.status(500).send("internal error");
  }
});

/* POST send notifications in broadcast */
router.post("/broadcast", async function (req, res, next) {
  try {
    const uid = req.decodedUID;
    const { receiver_id, title, body } = req?.body;

    await sendNotification(
      uid,
      receiver_id,
      null,
      null,
      null,
      title,
      body,
      "broadcast"
    );

    res.status(200).send();
  } catch (err) {
    console.log(err)
    res.status(500).send("internal error");
  }
});

export default router;
