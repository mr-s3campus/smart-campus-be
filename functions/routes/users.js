import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
var router = express.Router();

/* GET test */
router.get("/test", async function (req, res, next) {
  try {
    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let sql = "SELECT * FROM Lesson";
      let results = await db.query(sql, []).catch((err) => {
        throw err;
      });

      res.status(200).send(results);
    });
  } catch (err) {
    res.status(500).send("internal error");
  }
});

export default router;
