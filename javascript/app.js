import * as XLSX from 'https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs';

var i = 0;

const url = "http://localhost:7007/fetch-excel"

const idField = document.getElementById("idField")

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("clickMe").addEventListener("click", () => {
    fetch(url + `?id=${idField.value}`, {
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
        //console.log(data[0]);
        loadTable(data)
        data.forEach(row => {
          console.log(row);
        });
      })
      .catch(error => {
        console.error("Fetch error:", error);
      });
  });
});


function loadTable(items) {
  const table = document.getElementById("tableBody");
  var new_tbody = document.createElement('tbody');
  new_tbody.id = "tableBody"
  table.parentNode.replaceChild(new_tbody, table)
  items.forEach( item => {
    
    let row = new_tbody.insertRow();
    let date = row.insertCell(0);
    date.innerHTML = item.Date;
    let flow = row.insertCell(1)
    console.log(flow)
    flow.innerHTML = item.WaterFlow
  });
}