import requests
import pandas as pd
from io import BytesIO

url = "https://vattenwebb.smhi.se/modelarea/basindownload/"

code = input("Skriv in delavrinningsområdets SUBID: ")
url += code
file_name = code + ".xls"

response = requests.get(url)

with open(file_name, 'wb') as f:
    f.write(response.content)


kävlinge = 147