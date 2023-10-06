export const makeLessons = (s3subjects, dbData) => {
  try {
    // lessons
    const lessons = s3subjects?.map((el) => ({
      lessonId: el?.lessonId,
      title: el?.lessonTitle,
      startTime: el?.startTime,
      endTime: el?.endTime,
      subjectCdlId: el?.subjectCdlId,
      classroomId: el?.classroomId,
    }));

    const newLessons = lessons?.filter((el) => !dbData?.includes(el?.lessonId));

    let singleQuery = "INSERT INTO Lesson VALUES (UUID(),?,?,?,?,?,?); ";
    let fullQuery = "";
    let args = [];
    newLessons?.forEach((el) => {
      fullQuery = fullQuery + singleQuery;
      args.push(
        el?.lessonId,
        el?.title,
        el?.startTime,
        el?.endTime,
        el?.subjectCdlId,
        el?.classroomId
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
