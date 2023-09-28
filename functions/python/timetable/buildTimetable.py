from requests import ConnectionError
from datetime import datetime
import json as j
import os
import constants
import getLessons
import cleanTimetable


def buildTimetable(date: str, aa: str, cc: str, aci: str, codInd: str):
    """This function get lessons from university website and build the timetable as a json file

    Args:
        date (str): research date (format 'yyyy-mm-dd')
        aa (str): academic year (format 'yyyy/yyyy')
        cc (str): course code
        aci (str): course year
        codInd (str): course address code

    Returns:
        list: lessons list

    example: buildTimetable('2022-10-26','2022/2023','2035','1','796')"""

    dateLessons = []

    try:
        lessons = getLessons.getLessons(aa, cc, aci, codInd)

        for lesson in lessons:
            if str(lesson["start"]).split(" ")[0] == date:
                dateLessons.append(lesson)

        dateLessons = cleanTimetable.cleanTimetable(date, dateLessons, aci, codInd)

        return dateLessons
    except ConnectionError:
        # if connection error, I load the default file

        # print("A connection error occurred: using offline version of file @ " + path)

        raise ConnectionError
    except:
        # if generic error, I load the updated local file

        raise Exception
