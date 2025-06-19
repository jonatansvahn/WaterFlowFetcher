from bottle import get, route, run, request, response, urlunquote as unquote, hook
import requests
import pandas as pd
from io import BytesIO
import math
import seaborn as sns
import matplotlib.pyplot as plt
import json

station_water = "Total\nstationskorrigerad\nvattenföring\n[m³/s]"


url = "https://vattenwebb.smhi.se/modelarea/basindownload/"
PORT = 7007



def handle_recent_values(date_col, flow_name, df):
  df.rename(columns={date_col: 'Date'}, inplace=True)
  df = df[['Date', flow_name]].copy()
  df.rename(columns={flow_name: 'WaterFlow'}, inplace=True)
  df = df.dropna()
  return df



@hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With'


@get('/fetch-excel')
def fetch_excel():
  id = request.query.id
  date_type = request.query.dateType
  start_date = request.query.startDate
  end_date = request.query.endDate
  
# Send request to SMHI
  response = requests.get(url + id)

# Change date look depending on datetype
  if date_type == "Årsvärden":
    start_date = start_date.split("-")[0]
    end_date = end_date.split("-")[0]
  elif date_type == "Månadsvärden":
    start_date = start_date.split("-")[0] + "-" + start_date.split("-")[1]
    end_date = end_date.split("-")[0] + "-" + end_date.split("-")[1]


  df = pd.read_excel(BytesIO(response.content), sheet_name=date_type)

# Dygnsvärden has two useless rows at the top, remove them by using the skiprow argument
  if date_type == "Dygnsvärden":
    df = pd.read_excel(BytesIO(response.content), sheet_name=date_type, skiprows=[0, 1])
  else:
    df = pd.read_excel(BytesIO(response.content), sheet_name=date_type)

  df.rename(columns={'Unnamed: 0': 'Date'}, inplace=True)
  df = df[["Date", station_water]].copy()

# Change from annoying name to a more reasonable one and drop two last useless rows
  df.rename(columns={station_water: 'WaterFlow'}, inplace=True)
  df.drop(df.tail(2).index, inplace=True)


# Recently updated values are in a different sheet in the excel-file, need to append them 
  if date_type == "Dygnsvärden" or date_type == "Månadsvärden":
    updated_df = pd.read_excel(BytesIO(response.content), sheet_name="Dygnsuppdaterade värden", skiprows=[0, 1])

    if date_type == "Månadsvärden":
      updated_df = handle_recent_values('Unnamed: 6', 'Total stationskorrigerad vattenföring\n[m³/s].1', updated_df)
    else:
      updated_df = handle_recent_values('Unnamed: 0', 'Total stationskorrigerad vattenföring\n[m³/s]', updated_df)
    df = pd.concat([df, updated_df])


# To handle situation where wanted slice goes outside dataframe range
  start_date = max(df["Date"].iloc[0], start_date)
  end_date = min(df["Date"].iloc[-1], end_date) 
  
# Retrieve rows inbetween dates
  df = df[df["Date"].between(start_date, end_date)]

# Flip dataframe so that we get most recent values first, (maybe more efficient to handle this in client-side when displaying values?)
  df = df.iloc[::-1]


  info_df = pd.read_excel(BytesIO(response.content), sheet_name="Områdesinformation")

  name = info_df.iloc[12].iloc[1]
  main_catchment_basin = info_df.iloc[13].iloc[1]

  if not pd.notna(main_catchment_basin):
    main_catchment_basin = "Ingen hittades"

  response.content_type = "application/json"
  data_json = df.to_json(orient="records")
  data_dict = json.loads(data_json)
  print(df.head)
  print(data_dict)

  result = {"name": name, "main_catchment_basin": main_catchment_basin, "data": data_dict}

  return result

run(host="localhost", port=PORT, debug=True)


