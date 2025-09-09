from bottle import get, route, run, request, response, urlunquote as unquote, hook, Bottle, static_file
import requests
import pandas as pd
from io import BytesIO
import json
from pyproj import Transformer
import os

station_water = "Total\nstationskorrigerad\nvattenföring\n[m³/s]"

transformer = Transformer.from_crs("EPSG:3006", "EPSG:4326", always_xy=True)

url = "https://vattenwebb.smhi.se/modelarea/basindownload/"
PORT = 7007

app = Bottle()

@app.get("/")
def index():
    return static_file("index.html", root="./static")

@app.get("/<filepath:path>")
def static_files(filepath):
    return static_file(filepath, root="./static")

@app.get("/health")
def health():
    return "ok"

def handle_recent_values(date_col, flow_name, df):
  df.rename(columns={date_col: 'date'}, inplace=True)
  df = df[['date', flow_name]].copy()
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
  response = requests.get(url + id)

# Change date look depending on datetype
  if date_type == "Årsvärden":
    start_date = start_date.split("-")[0]
    end_date = end_date.split("-")[0]
  elif date_type == "Månadsvärden":
    start_date = start_date.split("-")[0] + "-" + start_date.split("-")[1]
    end_date = end_date.split("-")[0] + "-" + end_date.split("-")[1]


  #df = pd.read_excel(BytesIO(response.content), sheet_name=date_type)
  excel_data = pd.read_excel(BytesIO(response.content), sheet_name=None)

  df = excel_data[date_type]

# Dygnsvärden has two useless rows at the top, remove them by using the skiprow argument
  if date_type == "Dygnsvärden":
    df = pd.read_excel(BytesIO(response.content), sheet_name=date_type, skiprows=[0, 1])
  #else:
    #df = pd.read_excel(BytesIO(response.content), sheet_name=date_type)

  df.rename(columns={'Unnamed: 0': 'date'}, inplace=True)
  df = df[["date", station_water]].copy()

# Change from annoying name to a more reasonable one and drop two last useless rows
  df.rename(columns={station_water: 'waterFlow'}, inplace=True)
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
  start_date = max(df["date"].iloc[0], start_date)
  end_date = min(df["date"].iloc[-1], end_date) 
  
# Retrieve rows inbetween dates
  df = df[df["date"].between(start_date, end_date)]

# Flip dataframe so that we get most recent values first, (maybe more efficient to handle this in client-side when displaying values?)
  #df = df.iloc[::-1]

  info_df = excel_data["Områdesinformation"] #pd.read_excel(BytesIO(response.content), sheet_name="Områdesinformation")

  confirmed_id = info_df.iloc[10].iloc[1]
  name = info_df.iloc[12].iloc[1]
  main_catchment_basin = info_df.iloc[13].iloc[1]
  area = info_df.iloc[15].iloc[1]

  coords = info_df.iloc[14].iloc[1].split(",")
  lon, lat = transformer.transform(coords[0], coords[1].strip(" "))

  if not pd.notna(main_catchment_basin):
    main_catchment_basin = "Inget hittades"

  response.content_type = "application/json"
  data_json = df.to_json(orient="records")
  data_dict = json.loads(data_json)

  result = {"id": confirmed_id, "name": name, "main_catchment_basin": main_catchment_basin, "area": area, "lat": lat, "lon": lon, "data": data_dict}
  return result

if __name__ == "__main__":
    # Lokal utveckling (Render kör via Gunicorn)
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True, reloader=True)


