from bottle import get, route, run, request, response, urlunquote as unquote, hook, Bottle, static_file
import requests
import pandas as pd
from io import BytesIO
import json
from pyproj import Transformer
import os
from datetime import datetime

station_water = "Total stationskorrigerad vattenföring [m³/s]"

transformer = Transformer.from_crs("EPSG:3006", "EPSG:4326", always_xy=True)

url = "https://vattenwebb.smhi.se/webservices/download/api/v1/excel//land/basin/bySubid/"
PORT = int(os.environ.get("PORT", 7007))

app = Bottle()


@app.get("/health")
def health():
    return "ok"

def handle_recent_values(date_col, flow_name, df):
  df.rename(columns={date_col: 'date'}, inplace=True)
  df = df[['date', flow_name]].copy()
  df["date"] = pd.to_datetime(df["date"], errors="coerce")
  df = df.dropna(subset=["date"])
  df.rename(columns={flow_name: 'waterFlow'}, inplace=True)
  df = df.dropna()
  return df



@app.hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With'


@app.get('/fetch-excel')
def fetch_excel():
  id = request.query.id
  date_type = request.query.dateType
  start_date = request.query.startDate
  end_date = request.query.endDate
  
  
# Send request to SMHI
  smhi_response = requests.get(url + id)

  date_format = "%Y-%m-%d"
# Change date look depending on datetype
  if date_type == "Årsvärden":
    start_date = start_date.split("-")[0]
    end_date = end_date.split("-")[0]
    date_format = "%Y"
  elif date_type == "Månadsvärden":
    start_date = start_date.split("-")[0] + "-" + start_date.split("-")[1]
    end_date = end_date.split("-")[0] + "-" + end_date.split("-")[1]
    date_format = "%Y-%m"

  start_date = datetime.strptime(start_date, date_format)
  end_date = datetime.strptime(end_date, date_format)

  #df = pd.read_excel(BytesIO(response.content), sheet_name=date_type)
  excel_data = pd.read_excel(BytesIO(smhi_response.content), sheet_name=None)

# Dygnsvärden has two useless rows at the top, remove them by using the skiprow argument
  rows_to_skip = 2
  if date_type == "Dygnsvärden":
      rows_to_skip = 6
  df = pd.read_excel(BytesIO(smhi_response.content), sheet_name=date_type, skiprows=rows_to_skip)

  df.rename(columns={'Unnamed: 0': 'date'}, inplace=True)
  df = df[["date", station_water]].copy()
  df["date"] = pd.to_datetime(df["date"], errors="coerce")
  df = df.dropna(subset=["date"])

# Change from annoying name to a more reasonable one and drop two last useless rows
  df.rename(columns={station_water: 'waterFlow'}, inplace=True)
  df.drop(df.tail(2).index, inplace=True)


# Recently updated values are in a different sheet in the excel-file, need to append them 
  if date_type == "Dygnsvärden" or date_type == "Månadsvärden":
    updated_df = pd.read_excel(BytesIO(smhi_response.content), sheet_name="Dygnsuppdaterade värden", skiprows=4)
    print(updated_df.columns)
    if date_type == "Månadsvärden":
      updated_df = handle_recent_values('Unnamed: 6', "Total stationskorrigerad vattenföring [m³/s].1", updated_df)
    else:
      updated_df = handle_recent_values('Unnamed: 0', "Total stationskorrigerad vattenföring [m³/s]", updated_df)
    df = pd.concat([df, updated_df])


# To handle situation where wanted slice goes outside dataframe range
  start_date = max(df["date"].iloc[0], start_date)
  end_date = min(df["date"].iloc[-1], end_date) 
  
# Retrieve rows inbetween dates
  df = df[df["date"].between(start_date, end_date)]

# Flip dataframe so that we get most recent values first, (maybe more efficient to handle this in client-side when displaying values?)
  #df = df.iloc[::-1]

  info_df = excel_data["Områdesinformation"] #pd.read_excel(BytesIO(smhi_response.content), sheet_name="Områdesinformation")

  confirmed_id = info_df.iloc[7].iloc[1]
  name = info_df.iloc[9].iloc[1]
  main_catchment_basin = info_df.iloc[10].iloc[1]
  area = info_df.iloc[11].iloc[1]

  coords = info_df.iloc[12].iloc[1]
  if pd.notna(coords):
    coords = coords.split(",")
    long, lat = transformer.transform(coords[0], coords[1].strip(" "))
  else:
    long = 0
    lat = 0

  if not pd.notna(main_catchment_basin):
    main_catchment_basin = "Inget hittades"

  response.content_type = "application/json"
  data_json = df.to_json(orient="records")
  data_dict = json.loads(data_json)

  print(data_dict)

  result = {"id": confirmed_id, "name": name, "main_catchment_basin": main_catchment_basin, "area": area, "lat": lat, "long": long, "data": data_dict}
  return result


if __name__ == "__main__":
  run(app, host="0.0.0.0", port=PORT)
