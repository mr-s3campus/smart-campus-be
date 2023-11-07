import functions from "firebase-functions";
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import bodyParser from "body-parser";
import "dotenv/config";

import timetableRouter from "./routes/timetable.js";
import newsRouter from "./routes/news.js";
import doorsRouter from "./routes/doors.js";
import userRouter from "./routes/user.js";

import { initializeApp } from "firebase-admin/app";
import { verifyToken } from "./middleware/authentication.js";
import { makeTimetables } from "./python/timetable/makeTimetables.js";
import { writeNews } from "./python/news/main.js";
import { makeNews } from "./python/news/makeNews.js";

const firebaseApp = initializeApp();

const app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

if (process.env.FUNCTIONS_EMULATOR) {
  global.serverAddress = "http://10.0.2.2";
  global.app = app;
}

console.log("ENVIRONMENT: ", process.env.FUNCTIONS_EMULATOR);

app.use("/timetable", timetableRouter);
app.use("/news", newsRouter);
app.use("/doors", doorsRouter);
app.use("/user", verifyToken, userRouter);

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

// app.get("/myip", (req, res) => {
//   fetch("https://7844-147-163-201-227.ngrok-free.app/receive");
//   res.send("request sent!");
// });

const day = 86400000;
makeTimetables();
setInterval(() => makeTimetables(), 2 * day); // every 3 days

makeNews();
setInterval(() => makeNews(), day / 2); // every 12 hours

export const api = functions.https.onRequest(app);
