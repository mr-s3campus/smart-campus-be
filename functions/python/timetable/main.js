import config from "../../database/config.js";
import { makeDb, withTransaction } from "../../database/middleware.js";
import { spawn } from "child_process";

export const writeTimetable = async function () {
  try {
    console.log("writing timetables...");
    // const spawn = require("child_process").spawn;
    const ls = spawn("python3", [
      "python/timetable/main.py",
      // params
      "2023-03-24",
      "2022/2023",
      "2035",
      "1",
      "796",
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

      const db = await makeDb(config);

      await withTransaction(db, async () => {
        let singleQuery = "INSERT INTO Lesson VALUES (?,?,?,?,?,?); ";
        let fullQuery = "";
        let args = [];
        data?.forEach((el) => {
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
