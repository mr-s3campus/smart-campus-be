import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
var router = express.Router();

/* POST get week timetable */
router.post("/", async function (req, res, next) {
  try {
    const db = await makeDb(config);

    const {
      startRange,
      endRange,
      academicYear, // 2023/2024
      courseCode, // 2035
      courseYear,
      courseAddressCode,
    } = req?.body;

    await withTransaction(db, async () => {
      let sql =
        "SELECT * FROM Lesson " +
        "WHERE academicYear = ? " +
        "AND courseCode = ? " +
        "AND courseYear = ? " +
        "AND courseAddressCode = ? " +
        "AND startTime > ? " +
        "AND endTime < ? " +
        "ORDER BY startTime ASC; ";
      let results = await db
        .query(sql, [
          academicYear,
          courseCode,
          courseYear,
          courseAddressCode,
          startRange,
          endRange,
        ])
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
