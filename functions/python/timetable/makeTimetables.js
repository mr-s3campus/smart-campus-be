import moment from "moment";
import { makeDb, withTransaction } from "../../database/middleware.js";
import { objectsUniq } from "../../middleware/utilities.js";
import { writeTimetable } from "./main.js";
import config from "../../database/config.js";
const { createHash } = await import("node:crypto");

const DATE_FORMAT = "YYYY-MM-DD";
const ACADEMIC_YEAR = "2023/2024";
const COURSE_CODE = "2035";
const ADDRESSES = ["796", "797"];
const YEARS = ["1", "2"];

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";

const getSemester = (d) => {
  // 1s start week 35
  // 1s end week 5
  // 2s start week 7
  // 2s end week 31
  const ddWeek = moment(d).week();
  if (ddWeek >= 35 || ddWeek <= 5) {
    return 1;
  } else if (ddWeek >= 7 && ddWeek <= 31) {
    return 2;
  } else {
    // for strange dates
    return 1;
  }
};

export const makeTimetables = async function () {
  try {
    // current week
    const days = [];
    const day1 = moment().startOf("isoweek").format(DATE_FORMAT);
    days?.push(day1);
    for (let i = 1; i < 10; i++) {
      if (i < 5) {
        days.push(
          moment().startOf("isoweek").add(i, "days").format(DATE_FORMAT)
        );
      } else if (i === 5) {
        days.push(
          moment().startOf("isoweek").add(1, "weeks").format(DATE_FORMAT)
        );
      } else {
        days.push(
          moment()
            .startOf("isoweek")
            .add(1, "weeks")
            .add(i - 5, "days")
            .format(DATE_FORMAT)
        );
      }
    }

    console.log(days);

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

    // subjectsCDL
    const subjectsCDLUniq = s3subjectsUniq?.map((el) => ({
      subjectId: el?.id,
      cdlId: el?.cdl,
      curriculumId: el?.curriculum,
      academicYear: el?.academicYear,
      courseYear: el?.courseYear,
      semester: getSemester(el?.date),
    }));

    const classrooms = totalData?.map((el) => ({
      id: el?.oidAula,
      title: el?.descAulaBreve?.split("-")[0]?.trim(),
      building: el?.descAulaBreve?.split("-")[1]?.trim(),
    }));

    const classroomsUniq = objectsUniq(classrooms, "id");

    // lessons
    const lessons = s3subjects?.map((el) => ({
      lessonId: el?.lessonId,
      title: el?.lessonTitle,
      startTime: el?.startTime,
      endTime: el?.endTime,
      subjectCdlId: el?.subjectCdlId,
      classroomId: el?.classroomId,
    }));

    console.log(
      s3subjectsUniq?.length,
      subjectsCDLUniq?.length,
      classroomsUniq?.length,
      lessons?.length
    );

    const db = await makeDb(config);

    let fullQuery = "";
    let totalArgs = [];

    // s3subjects
    let sqS3S = "INSERT INTO S3Subject VALUES (?,?,?,?,?,?); ";
    let fqS3S = "";
    let argsS3S = [];
    s3subjectsUniq?.forEach((el) => {
      fqS3S = fqS3S + sqS3S;
      argsS3S.push(
        el?.id,
        el?.title,
        el?.cfu,
        el?.ssd,
        el?.teacher,
        el?.subjectDescription
      );
    });

    fullQuery = fullQuery + fqS3S;
    totalArgs = totalArgs.concat(argsS3S);

    // subjectCDL
    let sqSCDL = "INSERT INTO SubjectCDL VALUES (?,?,?,?,?,?); ";
    let fqSCDL = "";
    let argsSCDL = [];
    subjectsCDLUniq?.forEach((el) => {
      fqSCDL = fqSCDL + sqSCDL;
      argsSCDL.push(
        el?.subjectId,
        el?.cdlId,
        el?.curriculumId,
        el?.academicYear,
        el?.courseYear,
        el?.semester
      );
    });

    fullQuery = fullQuery + fqSCDL;
    totalArgs = totalArgs.concat(argsSCDL);

    // classrooms
    let sqCR = "INSERT INTO Classroom VALUES (?,?,?); ";
    let fqCR = "";
    let argsCR = [];
    classroomsUniq?.forEach((el) => {
      fqCR = fqCR + sqCR;
      argsCR.push(el?.id, el?.title, el?.building);
    });

    fullQuery = fullQuery + fqCR;
    totalArgs = totalArgs.concat(argsCR);

    // lessons
    let sqLES = "INSERT INTO Lesson VALUES (UUID(),?,?,?,?,?,?); ";
    let fqLES = "";
    let argsLES = [];
    lessons?.forEach((el) => {
      fqLES = fqLES + sqLES;
      argsLES.push(
        el?.lessonId,
        el?.title,
        el?.startTime,
        el?.endTime,
        el?.subjectCdlId,
        el?.classroomId
      );
    });

    fullQuery = fullQuery + fqLES;
    totalArgs = totalArgs.concat(argsLES);

    // now we have all the sql queries and all the params

    await withTransaction(db, async () => {
      if (fullQuery?.length > 0) {
        await db.query(fullQuery, totalArgs).catch((err) => {
          console.log(err);
          // if (err?.message?.split(":")[0] === "ER_DUP_ENTRY") {
          //   // do nothing
          //   // POSSIBLE ERROR: what if there is a duplicate before of a non-duplicate?
          //   // it makes the error and the following queries are not executed.
          //   // SOLUTION: it should never happen
          //   // that a duplicate is followed by non-duplicates
          //   // because it's always the same data (week plan),
          //   // so or they are all duplicates or they are not
          // } else {
          //   console.log(err);
          // }
        });
      }
    });

    console.log("db updated with lessons!");
  } catch (err) {
    console.log(err);
  }
};
