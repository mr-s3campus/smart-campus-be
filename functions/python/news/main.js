import config from "../../database/config.js";
import { makeDb, withTransaction } from "../../database/middleware.js";
import { spawn } from "child_process";

const MONTHS = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
];

const formatDate = (date) => {
  // date received as DD-mm-YYYY
  // -> YYYY-MM-DD
  let arrayDate = date?.split("-");
  let monthNumber = MONTHS.indexOf(arrayDate[1]) + 1;
  monthNumber =
    monthNumber <= 0 // in case of error set January as default
      ? "01"
      : monthNumber < 10
      ? "0" + monthNumber
      : monthNumber;
  arrayDate[1] = monthNumber;
  const result = arrayDate?.reverse()?.join("-");
  return result;
};

export const writeNews = async function () {
  try {
    // const spawn = require("child_process").spawn;
    const ls = spawn("python3", ["python/news/main.py"]);

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
        let singleQuery = "INSERT INTO News VALUES (UUID(),?,?,?,?); ";
        let fullQuery = "";
        let args = [];
        data?.forEach((el) => {
          fullQuery = fullQuery + singleQuery;
          args.push(
            el?.title,
            formatDate(el?.date),
            el?.content,
            el?.fullContent
          );
        });

        await db.query(fullQuery, args).catch((err) => {
          // FIX ME: pay attention to duplicates
          // no errors because of UUID
          console.log(err);
        });
      });
      console.log(`news child process exited with code ${code}`);
    });
  } catch (err) {
    console.log(err);
  }
};
