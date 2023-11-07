export const makeLessons = (s3subjects, dbData) => {
  try {
    // lessons
    const lessons = s3subjects?.map((el) => ({
      idLesson: el?.idLesson, // created by me
      lessonId: el?.lessonId, // received by data
      title: el?.lessonTitle,
      startTime: el?.startTime,
      endTime: el?.endTime,
      subjectCdlId: el?.subjectCdlId,
      classroomId: el?.classroomId,
    }));

    const newLessons = lessons?.filter((el) => !dbData?.includes(el?.idLesson));

    let singleQuery = "INSERT INTO Lesson VALUES (?,?,?,?,?,?,?); ";
    let fullQuery = "";
    let args = [];
    newLessons?.forEach((el) => {
      fullQuery = fullQuery + singleQuery;
      args.push(
        el?.idLesson,
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
