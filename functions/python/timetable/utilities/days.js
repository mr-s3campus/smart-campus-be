import moment from "moment";

const DATE_FORMAT = "YYYY-MM-DD";

export const makeDays = () => {
  try {
    const days = [];
    const day1 = moment().startOf("isoweek").format(DATE_FORMAT);
    days?.push(day1);
    for (let i = 1; i < 10; i++) {
      if (i < 5) {
        days.push(
          moment().startOf("isoweek").add(i, "days").format(DATE_FORMAT)
        );
      } else if (i === 5) {
        days.push(
          moment().startOf("isoweek").add(1, "weeks").format(DATE_FORMAT)
        );
      } else {
        days.push(
          moment()
            .startOf("isoweek")
            .add(1, "weeks")
            .add(i - 5, "days")
            .format(DATE_FORMAT)
        );
      }
    }

    return days;
  } catch (err) {
    throw err;
  }
};
