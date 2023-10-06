import moment from "moment";

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

export const makeSubjectsCDL = (s3subjectsUniq, dbData) => {
  try {
    // subjectsCDL
    const subjectsCDLUniq = s3subjectsUniq?.map((el) => ({
      subjectId: el?.id,
      cdlId: el?.cdl,
      curriculumId: el?.curriculum,
      academicYear: el?.academicYear,
      courseYear: el?.courseYear,
      semester: getSemester(el?.date),
    }));

    const newSubjectsCDL = subjectsCDLUniq?.filter(
      (el) => !dbData?.includes(el?.subjectId)
    );

    // subjectCDL
    let singleQuery = "INSERT INTO SubjectCDL VALUES (?,?,?,?,?,?); ";
    let fullQuery = "";
    let args = [];
    newSubjectsCDL?.forEach((el) => {
      fullQuery = fullQuery + singleQuery;
      args.push(
        el?.subjectId,
        el?.cdlId,
        el?.curriculumId,
        el?.academicYear,
        el?.courseYear,
        el?.semester
      );
    });

    return {
      fullQuery,
      args,
    };
  } catch (err) {
    throw err;
  }
};
