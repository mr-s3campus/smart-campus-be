import functions from "firebase-functions";
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import bodyParser from "body-parser";

import usersRouter from "./routes/users.js";
import { writeTimetable } from "./python/timetable/main.js";
import { writeNews } from "./python/news/main.js";
import timetableRouter from "./routes/timetable.js";
import newsRouter from "./routes/news.js";
import doorsRouter from "./routes/doors.js";

import { initializeApp } from "firebase-admin/app";
import { verifyToken } from "./middleware/authentication.js";
import { makeTimetables } from "./python/timetable/makeTimetables.js";
const firebaseApp = initializeApp();

const app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

global.serverAddress = "http://10.0.2.2";
global.app = app;

console.log("ENVIRONMENT: ", process.env.FUNCTIONS_EMULATOR);

app.use("/users", usersRouter);
app.use("/timetable", timetableRouter);
app.use("/news", newsRouter);
app.use("/doors", doorsRouter);

app.get("/test", (req, res) => {
  res.send("You did it!");
});

/* GET */
app.get("/auth", async function (req, res, next) {
  try {
    verifyToken(req, res, () => {
      res
        .status(200)
        .send({ decodedUID: req.decodedUID, decodedEMAIL: req.decodedEMAIL });
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

makeTimetables();
const day = 86400000;
setInterval(() => makeTimetables(), 3 * day); // every 3 days

// writeNews()

export const api = functions.https.onRequest(app);
