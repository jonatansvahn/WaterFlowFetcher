import requests
import pandas as pd
from io import BytesIO
import math
import seaborn as sns
import matplotlib.pyplot as plt

station_water = "Total\nstationskorrigerad\nvattenföring\n[m³/s]"



url = "https://vattenwebb.smhi.se/modelarea/basindownload/"

code =  "147" #input("Skriv in delavrinningsområdets SUBID: ")
url += code
file_name = code + ".xls"

response = requests.get(url)

data = pd.read_excel(BytesIO(response.content))

#with open(file_name, 'wb') as f:
#    f.write(response.content)

df = pd.read_excel(BytesIO(response.content), "Månadsvärden")
print(df.head())
df.rename(columns={'Unnamed: 0': 'Datum'}, inplace=True)

"""
df.columns = df.iloc[1]
df = df.drop(1).reset_index(drop=True)
df = df.dropna()

print(df.head())

df.columns = ['Datum' if pd.isna(col) else col for col in df.columns]
"""
df = df.dropna()

#print(year_data.head())
#print(year_data.head())

#print(year_data.loc[0])

df.set_index("Datum", inplace=True)
print(df.head())
#water = year_data["Total\nvattenföring\n[m³/s]"].dropna()
#yearly_values = []

#for val in year_data["Total\nvattenföring\n[m³/s]"]:
#  if not math.isnan(val):
#    yearly_values.append(val)


sns.barplot(data=df, x="Datum", y=station_water)
plt.title("Total stationskorrigerad vattenföring per År")
plt.show()

kävlinge = 147