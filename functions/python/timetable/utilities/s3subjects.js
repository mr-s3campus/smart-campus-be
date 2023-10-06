import moment from "moment";
import objectsUniq from "./objectsUniq.js";
const { createHash } = await import("node:crypto");

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";

export const makeS3Subjects = (totalData, dbData) => {
  try {
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

    const newS3Subjects = s3subjectsUniq?.filter(
      (el) => !dbData?.includes(el?.id)
    );

    // s3subjects
    let singleQuery = "INSERT INTO S3Subject VALUES (?,?,?,?,?,?); ";
    let fullQuery = "";
    let args = [];
    newS3Subjects?.forEach((el) => {
      fullQuery = fullQuery + singleQuery;
      args.push(
        el?.id,
        el?.title,
        el?.cfu,
        el?.ssd,
        el?.teacher,
        el?.subjectDescription
      );
    });
    
    return {
      fullQuery: fullQuery,
      args: args,
    };
  } catch (err) {
    throw err;
  }
};
