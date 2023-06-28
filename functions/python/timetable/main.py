import buildTimetable
import json as j

def main():
    """Args:
        date: str, aa: str, cc: str, aci: str, codInd: str
        date (str): research date (format 'yyyy-mm-dd')
        aa (str): academic year (format 'yyyy/yyyy')
        cc (str): course code
        aci (str): course year
        codInd (str): course address code
    """
    result = buildTimetable.buildTimetable('2023-03-24','2022/2023','2035','1','796')
    # FIX ME: add params
    # print(type(result))
    stringResult = j.dumps(result, ensure_ascii=False) # convert to string
    print(stringResult)
    return result

main()