import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
var router = express.Router();

/* GET news and announcements */
router.get("/", async function (req, res, next) {
  try {
    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let sql =
        "SELECT * FROM News ORDER BY publishedAt DESC ;" +
        "SELECT * FROM Announcement ORDER BY publishedAt DESC ;";
      let results = await db.query(sql, []).catch((err) => {
        throw err;
      });

      res.status(200).send({
        news: results[0],
        announcements: results[1],
      });
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
