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
      courseCode, // cdl: 2035
      courseYear,
      courseAddressCode, // curriculum
    } = req?.body;

    await withTransaction(db, async () => {
      let sql = `
        SELECT L.id AS id, L.title AS title, L.startTime AS startTime, L.endTime AS endTime, C.title AS classroom, C.building AS building
        FROM SubjectCDL S, Lesson L, Classroom C
        WHERE S.subjectId = L.subjectCdlId
        AND L.classroomId = C.id
        AND cdlId = ?
        AND courseYear = ?
        AND curriculumId = ?
        AND academicYear = ?
        AND startTime > ?
        AND endTime < ?
        ORDER BY startTime ASC;
      `;
      let results = await db
        .query(sql, [
          courseCode,
          courseYear,
          courseAddressCode,
          academicYear,
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
