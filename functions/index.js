import functions from "firebase-functions";
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import usersRouter from "./routes/users.js";
import { writeTimetable } from "./python/timetable/main.js";

const app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));

app.use("/users", usersRouter);

app.get("/test", (req, res) => {
  res.send("You did it! 🥳");
});

// writeTimetable()

export const api = functions.https.onRequest(app);
