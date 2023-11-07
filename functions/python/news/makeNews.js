import moment from "moment";
import config from "../../database/config.js";
import { makeDb, withTransaction } from "../../database/middleware.js";
import { writeNews } from "./main.js";
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

export const makeNews = async function () {
  try {
    // console.log("making news...");

    let data = await writeNews();

    // console.log("NEWS DATA LENGTH: ", data?.length);

    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let singleQueryNews = "INSERT INTO News VALUES (?,?,?,?,?,?); ";
      let singleQueryAnnouncement =
        "INSERT INTO Announcement VALUES (?,?,?,?,?,?); ";
      let fullQuery = "";
      let args = [];
      data
        ?.sort((a, b) =>
          // FIX ME: Deprecation warning: value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions.
          moment(formatDate(a?.date), "YYYY-MM-DD").isAfter(
            moment(formatDate(b?.date), "YYYY-MM-DD")
          )
            ? -1
            : 1
        )
        ?.forEach((el) => {
          // isAnnouncement: 1 for announcements; 0 for news
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
            el?.fullContent,
            el?.link
          );
        });

      if (fullQuery?.length > 0) {
        await db.query(fullQuery, args).catch((err) => {
          if (err?.message?.split(":")[0] === "ER_DUP_ENTRY") {
            // do nothing
            // POSSIBLE ERROR: what if there is a duplicate before of a non-duplicate?
            // it makes the error and the following queries are not executed.
            // SOLUTION: this should never happen because I sort news by date, so if there is a duplicate
            // then all the next queries should contain duplicates too,
            // while the non-duplicates should be over it
            // and so they should be executed before the error is thrown
          } else {
            console.log(err);
          }
        });
      }
    });
    console.log("db updated with news and announcements!");
  } catch (err) {
    console.log(err);
  }
};
