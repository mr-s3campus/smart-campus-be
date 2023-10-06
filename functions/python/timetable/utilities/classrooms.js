import objectsUniq from "./objectsUniq.js";

export const makeClassrooms = (totalData, dbData) => {
  try {
    // classrooms
    const classrooms = totalData?.map((el) => ({
      id: el?.oidAula,
      title: el?.descAulaBreve?.split("-")[0]?.trim(),
      building: el?.descAulaBreve?.split("-")[1]?.trim(),
    }));

    const classroomsUniq = objectsUniq(classrooms, "id");

    const newClassrooms = classroomsUniq?.filter(
      (el) => !dbData?.includes(el?.id)
    );

    let singleQuery = "INSERT INTO Classroom VALUES (?,?,?); ";
    let fullQuery = "";
    let args = [];
    newClassrooms?.forEach((el) => {
      fullQuery = fullQuery + singleQuery;
      args.push(el?.id, el?.title, el?.building);
    });

    return {
      fullQuery,
      args,
    };
  } catch (err) {
    throw err;
  }
};
