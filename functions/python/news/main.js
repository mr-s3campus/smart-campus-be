import config from "../../database/config.js";
import { makeDb, withTransaction } from "../../database/middleware.js";
import { spawn } from "child_process";
import moment from "moment/moment.js";
const { createHash } = await import("node:crypto");

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
    console.log("writing news...");
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

      console.log('NEWS DATA LENGTH: ', data?.length)

      const db = await makeDb(config);

      await withTransaction(db, async () => {
        let singleQueryNews = "INSERT INTO News VALUES (?,?,?,?,?); ";
        let singleQueryAnnouncement =
          "INSERT INTO Announcement VALUES (?,?,?,?,?); ";
        let fullQuery = "";
        let args = [];
        data
          // ?.sort((a, b) =>
          //   moment(formatDate(a?.date)).isAfter(moment(formatDate(b?.data)))
          //     ? 1
          //     : -1
          // )
          ?.forEach((el) => {
            // isAnnouncement = 1 for announcements; = 0 for news
            fullQuery =
              fullQuery +
              (el?.isAnnouncement ? singleQueryAnnouncement : singleQueryNews);
            var id = createHash("md5")
              .update(el?.title + formatDate(el?.date))
              .digest("hex");
            args.push(
              id,
              el?.title,
              formatDate(el?.date),
              el?.content,
              el?.fullContent
            );
          });

        if (fullQuery?.length > 0) {
          await db.query(fullQuery, args).catch((err) => {
            // no errors because of UUID
            if (err?.message?.split(":")[0] === "ER_DUP_ENTRY") {
              // nothing
              // FIX ME: what if there is a duplicate before of a non-duplicate?
              // it makes the error and the following queries are not executed
            } else {
              console.log(err);
            }
          });
        }
      });
      console.log(`news child process exited with code ${code}`);
    });
  } catch (err) {
    console.log(err);
  }
};
