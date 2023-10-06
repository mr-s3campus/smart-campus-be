import moment from "moment";
import { makeDb, withTransaction } from "../../database/middleware.js";
import { writeTimetable } from "./main.js";
import config from "../../database/config.js";
import { makeDays } from "./utilities/days.js";
import objectsUniq from "./utilities/objectsUniq.js";
import { makeS3Subjects } from "./utilities/s3subjects.js";
import { makeSubjectsCDL } from "./utilities/subjectsCDL.js";
import { makeClassrooms } from "./utilities/classrooms.js";
import { makeLessons } from "./utilities/lessons.js";
const { createHash } = await import("node:crypto");

const ACADEMIC_YEAR = "2023/2024";
const COURSE_CODE = "2035";
const ADDRESSES = ["796", "797"];
const YEARS = ["1", "2"];

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";


export const makeTimetables = async function () {
  try {
    // current week
    const days = makeDays();

    let promises = [];

    ADDRESSES.forEach((address) => {
      YEARS.forEach((year) => {
        days.forEach(async (d) => {
          promises.push(
            writeTimetable(d, ACADEMIC_YEAR, COURSE_CODE, year, address)
          );
        });
      });
    });

    const db1 = await makeDb(config);

    // get values from DB to avoid duplicates errors
    let dbValues = [];
    await withTransaction(db1, async () => {
      let sql = `
        SELECT id FROM S3Subject;
        SELECT subjectId FROM SubjectCDL;
        SELECT id FROM Classroom;
        SELECT DISTINCT lessonId FROM Lesson;
      `;
      dbValues = await db1.query(sql, []).catch((err) => {
        console.log(err);
      });
    });

    const dbS3SubjectsIds = dbValues[0]?.map((el) => el?.id);
    const dbSubjectCDLIds = dbValues[1]?.map((el) => el?.subjectId);
    const dbClassroomsIds = dbValues[2]?.map((el) => el?.id);
    const dbLessonsIds = dbValues[3]?.map((el) => el?.lessonId);

    let totalData = await Promise.all(promises); // totalData is an array of array of lesson-objects
    totalData = totalData?.flat();

    // s3subjects
    const s3subjects = totalData?.map((el) => {
      let splitTitle = el?.title?.split("-");
      const toBeHashed = el?.title + el?.cdl + el?.curriculum;
      const subjectId = createHash("md5").update(toBeHashed).digest("hex");
      const s = {
        id: subjectId, // 32 chars
        title: el?.title?.split("(")[0]?.trim(),
        cfu: parseInt(
          el?.title.split("(")[1]?.split(")")[0]?.split(" ")[0]?.trim()
        ),
        ssd: "null", // FIX ME
        teacher: splitTitle[splitTitle?.length - 1]?.trim(),
        subjectDescription: el?.title,
        // fields for subjectsCDL
        cdl: el?.cdl,
        curriculum: el?.curriculum,
        academicYear: el?.academicYear,
        courseYear: el?.courseYear,
        // fields for lesson
        lessonId: el?.id,
        lessonTitle: el?.title,
        startTime: moment(el?.start).format(DATETIME_FORMAT),
        endTime: moment(el?.end).format(DATETIME_FORMAT),
        subjectCdlId: subjectId,
        classroomId: el?.oidAula,
      };
      return s;
    });

    const s3subjectsUniq = objectsUniq(s3subjects, "id");

    const db = await makeDb(config);

    // query building

    let fullQuery = "";
    let totalArgs = [];

    // s3subjects
    const newS3Subjects = makeS3Subjects(totalData, dbS3SubjectsIds);
    fullQuery = fullQuery + newS3Subjects?.fullQuery;
    totalArgs = totalArgs.concat(newS3Subjects?.args);

    // subjectCDL
    const newSubjectsCDL = makeSubjectsCDL(s3subjectsUniq, dbSubjectCDLIds);
    fullQuery = fullQuery + newSubjectsCDL?.fullQuery;
    totalArgs = totalArgs.concat(newSubjectsCDL?.args);

    // classrooms
    const newClassrooms = makeClassrooms(totalData, dbClassroomsIds);
    fullQuery = fullQuery + newClassrooms?.fullQuery;
    totalArgs = totalArgs.concat(newClassrooms?.args);

    // lessons
    const newLessons = makeLessons(s3subjects, dbLessonsIds);
    fullQuery = fullQuery + newLessons?.fullQuery;
    totalArgs = totalArgs.concat(newLessons?.args);

    // now we have all the sql queries and all the params

    await withTransaction(db, async () => {
      if (fullQuery?.length > 0) {
        await db.query(fullQuery, totalArgs).catch((err) => {
          console.log(err);
        });
      }
    });

    console.log("db updated with lessons!");
  } catch (err) {
    console.log(err);
  }
};
