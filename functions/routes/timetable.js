import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
var router = express.Router();

/* GET test */
router.post("/", async function (req, res, next) {
  try {
    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let sql =
        "SELECT * FROM Lesson " +
        "WHERE startTime > ? AND " +
        "endTime < ? " +
        " ORDER BY startTime ASC; ";
      let results = await db
        .query(sql, [req?.body?.startRange, req?.body?.endRange])
        .catch((err) => {
          throw err;
        });

      res.status(200).send(results);
    });
  } catch (err) {
    res.status(500).send("internal error");
  }
});

export default router;
