import { spawn } from "child_process";

export const writeTimetable = async function (
  date,
  academicYear,
  cdl,
  courseYear,
  curriculum
) {
  // format date: YYYY-MM-DD
  // academicYear: YYYY/YYYY
  // cdl: '2035'
  // courseYear: '1' or '2'
  // curriculum: '796' or '797'
  try {
    // console.log(`writing timetables for ${date}`);
    const ls = spawn("python3", [
      "python/timetable/main.py",
      // params
      date,
      academicYear,
      cdl,
      courseYear,
      curriculum,
    ]);

    const exit = (data) => {
      let parsed = JSON.parse(data);
      let result = [];
      if (parsed?.length > 0) {
        result = parsed?.map((el) => ({
          ...el,
          date,
          academicYear,
          cdl,
          courseYear,
          curriculum,
        }));
      }
      return result;
    };

    let scriptOutput = "";
    for await (const chunk of ls.stdout) {
      // console.log("stdout chunk: " + chunk);
      scriptOutput += chunk;
    }
    let error = "";
    for await (const chunk of ls.stderr) {
      // console.error("stderr chunk: " + chunk);
      error += chunk;
    }
    const exitCode = await new Promise((resolve, reject) => {
      ls.on("close", resolve);
    });

    if (exitCode) {
      throw new Error(`subprocess error exit ${exitCode}, ${error}`);
    }
    return exit(scriptOutput);
  } catch (err) {
    console.log(err);
  }
};
