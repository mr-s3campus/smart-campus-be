import getNews
import json as j

def main():
    news = getNews.getNews(0) # for news
    announcements = getNews.getNews(1) # for announcements
    result = j.loads(news) + j.loads(announcements) # convert to list and concat
    stringResult = j.dumps(result, ensure_ascii=False) # reconvert to string
    print(stringResult)
    return stringResult

main()