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

import { initializeApp } from 'firebase-admin/app';
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

app.use("/users", usersRouter);
app.use("/timetable", timetableRouter);
app.use("/news", newsRouter);
app.use("/doors", doorsRouter);

app.get("/test", (req, res) => {
  res.send("You did it!");
});

// writeTimetable(new Date().toISOString().split("T")[0], "2023/2024", "1", "796");
// writeTimetable("2023-09-19", "2023/2024", "1", "796");
// writeNews()

export const api = functions.https.onRequest(app);
