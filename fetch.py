from bottle import get, route, run, request, response, urlunquote as unquote, hook
import requests
import pandas as pd
from io import BytesIO
import math
import seaborn as sns
import matplotlib.pyplot as plt
import json
import time

station_water = "Total\nstationskorrigerad\nvattenföring\n[m³/s]"

bigger_treatment_plant = "Större avloppsreningsverk"

smaller_treatment_plant = "Mindre avloppsreningsverk"


url = "https://vattenwebb.smhi.se/modelarea/basindownload/"
PORT = 7007




while True:
  id = input("Ange ID: ")
  print("")

  # Send request to SMHI
  response = requests.get(url + id)



  #df = pd.read_excel(BytesIO(response.content), sheet_name=date_type)
  excel_data = pd.read_excel(BytesIO(response.content), sheet_name=None)

  info_df = excel_data["Områdesinformation"] #pd.read_excel(BytesIO(response.content), sheet_name="Områdesinformation")
  
  confirmed_id = info_df.iloc[10].iloc[1]
  print("SUB ID Delavrinningsområde:", confirmed_id)
  name = info_df.iloc[12].iloc[1]
  print("Namn delavrinningsområde:", name)
  main_catchment_basin = info_df.iloc[13].iloc[1]
  print("Namn huvudavrinningsområde:", main_catchment_basin)
  area = str(info_df.iloc[15].iloc[1]).replace(".", ",")
  print("Area:", area)
  coordinates = info_df.iloc[14].iloc[1]
  print("SWEREFF:", coordinates)

  cell_string = ""

  plants = []

  9

  count_big = False
  count_small = False

  row = 0

  while cell_string != "Industri - Övrigt":
    cell_string = info_df.iloc[row].iloc[9]
    print(cell_string, " ")
    row += 1
    if cell_string == bigger_treatment_plant:
      count_big = True
      continue
    elif cell_string == smaller_treatment_plant:
      count_big = False
      count_small = True
      continue
    elif cell_string == "Industri - Övrigt":
      break
    if count_big or count_small:
      plants.append(cell_string)


  print("Reningsverk: ", " ")
  for plant in plants:
    print(plant, " ")

  print("")

"Ã¶ = Ö"
"Ã¥ = Å"

if not pd.notna(main_catchment_basin):
  main_catchment_basin = "Inget hittades"
