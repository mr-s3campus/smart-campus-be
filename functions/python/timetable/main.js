import moment from "moment";
import config from "../../database/config.js";
import { makeDb, withTransaction } from "../../database/middleware.js";
import { spawn } from "child_process";

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm"
export const writeTimetable = async function (
  date,
  academicYear,
  courseCode,
  courseYear,
  address
) {
  // format date: YYYY-MM-DD
  // academicYear: YYYY/YYYY
  // courseYear: '1' or '2'
  // address: '796' or '797'
  try {
    // console.log(`writing timetables for ${date}`);
    const ls = spawn("python3", [
      "python/timetable/main.py",
      // params
      date,
      academicYear,
      courseCode,
      courseYear,
      address,
    ]);

    let scriptOutput = "";

    ls.stdout.on("data", async (scriptData) => {
      scriptOutput = scriptOutput + scriptData;
    });

    ls.stderr.on("data", (data) => {
      // console.log(`ERROR for ${date}:\n`);
      console.log(`stderr: ${data}`);
    });

    ls.on("close", async (code) => {
      let data = JSON.parse(scriptOutput);

      // console.log(`TIMETABLE for ${date} DATA LENGTH: `, data?.length);
      // console.log(data);

      const db = await makeDb(config);

      await withTransaction(db, async () => {
        let singleQuery = "INSERT INTO Lesson VALUES (?,?,?,?,?,?,?,?,?,?); ";
        let fullQuery = "";
        let args = [];
        data?.forEach((el) => {
          fullQuery = fullQuery + singleQuery;
          args.push(
            el?.id,
            el?.title,
            moment(el?.start).format(DATETIME_FORMAT),
            moment(el?.end).format(DATETIME_FORMAT),
            el?.descAulaBreve,
            el?.oidAula,
            academicYear,
            courseCode,
            courseYear,
            address
          );
        });

        if (fullQuery?.length > 0) {
          await db.query(fullQuery, args).catch((err) => {
            if (err?.message?.split(":")[0] === "ER_DUP_ENTRY") {
              // do nothing
              // FIX ME: what if there is a duplicate before of a non-duplicate?
              // it makes the error and the following queries are not executed.
              // Anyway, for the lessons it should never happen
              // that a duplicate is followed by non-duplicates
              // because it's always the same data
            } else {
              console.log(err);
            }
          });
        }
      });
      // console.log(`timetable child process for date: ${date} exited with code ${code}`);
    });
  } catch (err) {
    console.log(err);
  }
};
