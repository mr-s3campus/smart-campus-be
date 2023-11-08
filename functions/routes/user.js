import express from "express";
import { makeDb, withTransaction } from "../database/middleware.js";
import config from "../database/config.js";
var router = express.Router();

/* GET user */
router.get("/", async function (req, res, next) {
  try {
    const uid = req.decodedUID;
    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let sql = "SELECT * FROM S3User WHERE uid = ? ; ";
      let results = await db.query(sql, [uid]).catch((err) => {
        throw err;
      });

      if (results?.length === 0) {
        res.status(404).send("no user data found");
      } else {
        res.status(200).send(results);
      }
    });
  } catch (err) {
    console.log("ERROR get user");
    console.log(err);
    res.status(500).send("internal error");
  }
});

/* POST sign up */
router.post("/signup", async function (req, res, next) {
  try {
    const uid = req.decodedUID;
    const email = req.decodedEMAIL;
    const userRole = 3; // FIX ME
    const { firstname, surname } = req?.body;
    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let sql = "INSERT INTO S3User VALUES(?,?,?,?, null, ?, true, null); ";
      await db
        .query(sql, [uid, email, firstname, surname, userRole])
        .catch((err) => {
          if (err?.message?.split(":")[0] === "ER_DUP_ENTRY") {
            // user already registered: do nothing
          } else {
            throw err;
          }
        });

      res.status(200).send();
    });
  } catch (err) {
    res.status(500).send("internal error");
  }
});

/* POST push token */
router.post("/push", async function (req, res, next) {
  try {
    const uid = req.decodedUID;
    const { push_token } = req.body;
    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let sql = "UPDATE S3User SET push_token = ? WHERE uid = ? ;";
      await db.query(sql, [push_token, uid]).catch((err) => {
        throw err;
      });

      res.status(200).send();
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

export default router;
