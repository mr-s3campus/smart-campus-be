import config from "../../database/config.js";
import { makeDb, withTransaction } from "../../database/middleware.js";
import { spawn } from "child_process";

export const writeTimetable = async function (
  date,
  academicYear,
  courseYear,
  address
) {
  // format date: YYYY-MM-DD
  // academicYear: YYYY/YYYY
  // courseYear: '1' or '2'
  // address: '796' or '797'
  try {
    console.log("writing timetables...");
    // const spawn = require("child_process").spawn;
    const ls = spawn("python3", [
      "python/timetable/main.py",
      // params
      date,
      academicYear,
      "2035",
      courseYear,
      address,
    ]);

    let scriptOutput = "";

    ls.stdout.on("data", async (scriptData) => {
      scriptOutput = scriptOutput + scriptData;
    });

    ls.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    ls.on("close", async (code) => {
      let data = JSON.parse(scriptOutput);

      console.log('TIMETABLE DATA LENGTH: ', data?.length)

      const db = await makeDb(config);

      await withTransaction(db, async () => {
        let singleQuery = "INSERT INTO Lesson VALUES (?,?,?,?,?,?); ";
        let fullQuery = "";
        let args = [];
        data?.forEach((el) => {
          console.log(el)
          fullQuery = fullQuery + singleQuery;
          args.push(
            el?.id,
            el?.title,
            el?.start,
            el?.end,
            el?.descAulaBreve,
            el?.oidAula
          );
        });

        if (fullQuery?.length > 0) {
          await db.query(fullQuery, args).catch((err) => {
            // FIX ME: pay attention to duplicates
            console.log(err);
          });
        }
      });
      console.log(`timetable child process exited with code ${code}`);
    });
  } catch (err) {
    console.log(err);
  }
};
