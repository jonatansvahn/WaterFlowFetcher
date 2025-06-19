import * as XLSX from 'https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs';


const earliestDate = "2010-01-01";

const url = "http://localhost:7007/fetch-excel"

const idField = document.getElementById("idField")
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const areaName = document.getElementById("areaName");
const basinName = document.getElementById("basinName");
const areaText = document.getElementById("area")

var dateType = "Årsvärden"

document.addEventListener("DOMContentLoaded", () => {
  limitTimeInput();
  setActiveDateType();
  document.getElementById("searchButton").addEventListener("click", () => {
    fetchValues();
  });

  document.getElementById("yearButton").addEventListener("click", () => {
    dateType = "Årsvärden"
    //fetchValues();
  });

  document.getElementById("monthButton").addEventListener("click", () => {
    dateType = "Månadsvärden"
    //fetchValues();
  });

  document.getElementById("dayButton").addEventListener("click", () => {
    dateType = "Dygnsvärden"
    //fetchValues();
  });

  document.getElementById("idField").addEventListener("input", (event) => {
    //fetchValues();
  });

  document.getElementById("startDate").addEventListener("input", (event) => {
    //fetchValues();
  });

  document.getElementById("endDate").addEventListener("input", (event) => {
    //fetchValues();
  });
});

function fetchValues() {
  fetch(url + `?id=${idField.value}&dateType=${dateType}&startDate=${startDate.value}&endDate=${endDate.value}`, {
    method: "GET"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(result => {
      console.log("Data from backend:", result);

      loadTable(result.data);
      displayInformation(result.name, result.main_catchment_basin, result.area);
      
    })
    .catch(error => {
      console.error("Fetch error:", error);
    });
}

function loadTable(items) {
  const table = document.getElementById("tableBody");
  var new_tbody = document.createElement('tbody');
  new_tbody.id = "tableBody";
  table.parentNode.replaceChild(new_tbody, table);

  items.forEach( item => {
    let row = new_tbody.insertRow();
    let date = row.insertCell(0);
    date.innerHTML = item.Date;
    let flow = row.insertCell(1);
    flow.innerHTML = item.WaterFlow
    let dayFlow = row.insertCell(2);
    dayFlow.innerHTML = Math.round(item.WaterFlow * 3600 * 24)
  });
}

function displayInformation(name, mainCatchmentBasin, area) {
  areaName.textContent = name;
  basinName.textContent = mainCatchmentBasin;
  areaText.textContent = Math.round(area * 100) / 100;
}

function limitTimeInput() {
  startDate.min = earliestDate;
  endDate.min = earliestDate;
  const currentDate = new Date().toLocaleDateString();

  startDate.max = currentDate;
  endDate.max = currentDate;
}

function setActiveDateType() {
  if (document.getElementById("yearButton").checked) {
    dateType = "Årsvärden";
  }
  else if (document.getElementById("monthButton").checked) {
    dateType = "Månadsvärden";
  }
  else {
    dateType = "Dygnsvärden";
  }
}