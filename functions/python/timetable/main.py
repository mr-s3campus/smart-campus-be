import buildTimetable
import json as j
import sys

def main(date: str, aa: str, cc: str, aci: str, codInd: str):
    """Args:
        date (str): research date (format 'yyyy-mm-dd')
        aa (str): academic year (format 'yyyy/yyyy')
        cc (str): course code
        aci (str): course year
        codInd (str): course address code
    """
    try:
        result = buildTimetable.buildTimetable(date, aa, cc, aci, codInd)
        # FIX ME: add params
        # print(type(result))
        stringResult = j.dumps(result, ensure_ascii=False) # convert to string
        print(stringResult)
        return result
    except ConnectionError:
        return { "error": "Connection error" }
    except:
        return { "error": "Generic error" }
    

main(sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4],sys.argv[5])