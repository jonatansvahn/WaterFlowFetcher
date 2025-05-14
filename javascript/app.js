import * as XLSX from 'https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs';


const earliestDate = "2010-01-01";

const url = "http://localhost:7007/fetch-excel"

const idField = document.getElementById("idField")
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

var dateType = "Årsvärden"

document.addEventListener("DOMContentLoaded", () => {
  limitTimeInput();
  setActiveDateType();
  document.getElementById("searchButton").addEventListener("click", () => {
    fetchValues();
  });

  document.getElementById("yearButton").addEventListener("click", () => {
    dateType = "Årsvärden"
    fetchValues();
  });

  document.getElementById("monthButton").addEventListener("click", () => {
    dateType = "Månadsvärden"
    fetchValues();
  });

  document.getElementById("dayButton").addEventListener("click", () => {
    dateType = "Dygnsvärden"
    fetchValues();
  });

  document.getElementById("idField").addEventListener("input", (event) => {
    fetchValues();
  });

  document.getElementById("startDate").addEventListener("input", (event) => {

    fetchValues();
  });

  document.getElementById("endDate").addEventListener("input", (event) => {
    fetchValues();
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
    .then(data => {
      console.log("Data from backend:", data);
      
      loadTable(data);
      data.forEach(row => {
        console.log(row);
      });
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
    console.log(flow);
    flow.innerHTML = item.WaterFlow;
  });
}

function limitTimeInput() {
  console.log("test")
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