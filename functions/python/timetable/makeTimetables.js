import moment from "moment";
import { writeTimetable } from "./main.js";

const DATE_FORMAT = "YYYY-MM-DD";
const ACADEMIC_YEAR = "2023/2024";
const COURSE_CODE = "2035";
const ADDRESSES = ["796", "797"];
const YEARS = ["1", "2"];

export const makeTimetables = async function () {
  try {
    // current week
    const day1 = moment().startOf("isoweek").format(DATE_FORMAT);
    const day2 = moment().startOf("isoweek").add(1, "days").format(DATE_FORMAT);
    const day3 = moment().startOf("isoweek").add(2, "days").format(DATE_FORMAT);
    const day4 = moment().startOf("isoweek").add(3, "days").format(DATE_FORMAT);
    const day5 = moment().startOf("isoweek").add(4, "days").format(DATE_FORMAT);

    // next week
    const day6 = moment()
      .startOf("isoweek")
      .add(1, "weeks")
      .format(DATE_FORMAT);
    const day7 = moment()
      .startOf("isoweek")
      .add(1, "weeks")
      .add(1, "days")
      .format(DATE_FORMAT);
    const day8 = moment()
      .startOf("isoweek")
      .add(1, "weeks")
      .add(2, "days")
      .format(DATE_FORMAT);
    const day9 = moment()
      .startOf("isoweek")
      .add(1, "weeks")
      .add(3, "days")
      .format(DATE_FORMAT);
    const day10 = moment()
      .startOf("isoweek")
      .add(1, "weeks")
      .add(4, "days")
      .format(DATE_FORMAT);

    ADDRESSES.forEach((address) => {
      YEARS.forEach((year) => {
        writeTimetable(day1, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day2, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day3, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day4, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day5, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day6, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day7, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day8, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day9, ACADEMIC_YEAR, COURSE_CODE, year, address);
        writeTimetable(day10, ACADEMIC_YEAR, COURSE_CODE, year, address);
      });
    });
  } catch (err) {
    console.log(err);
  }
};
