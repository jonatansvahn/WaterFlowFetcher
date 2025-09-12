
const earliestDate = "2010-01-01";

const url = "https://vattenwebben.onrender.com/fetch-excel"

const idField = document.getElementById("idField")
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const areaId = document.getElementById("areaId")
const areaName = document.getElementById("areaName");
const basinName = document.getElementById("basinName");
const areaText = document.getElementById("area");

const downloadTableButton = document.getElementById("downloadTableButton")

const downloadChartButton = document.getElementById("downloadChartButton")

const mapContainer = document.getElementById("map")


let dateType = "Årsvärden"

let lineChart;
let barChart;

let map;

let currentId = 0;
let currentData;

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

  downloadTableButton.addEventListener("click", function() {
    downloadCSV()
  });
  
  downloadChartButton.addEventListener("click", function() {
    downloadChart();
  });
  
  
  downloadTableButton.style.visibility = "hidden";
  downloadChartButton.style.visibility = "hidden";
  mapContainer.style.visibility = "hidden";
});

function fetchValues() {
  document.body.style.cursor = 'wait';
  fetch(url + `?id=${idField.value}&dateType=${dateType}&startDate=${startDate.value}&endDate=${endDate.value}`, {
    method: "GET"
  })
    .then(response => {
      document.body.style.cursor = '';
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(result => {
      console.log("Data from backend:", result);
      console.log("data:", result.data)
      loadTable(result.data);
      if (result.id != currentId) {
        loadMap(result.lat, result.long)
      } 
      displayInformation(result.id, result.name, result.main_catchment_basin, result.area);
      drawGraph(result.data);
      
    })
    .catch(error => {
      document.body.style.cursor = '';
      console.error("Fetch error:", error);
    });
}

function loadTable(items) {
  if (items.length > 0) {
    currentData = items;
    downloadTableButton.style.visibility = "visible";
    const table = document.getElementById("tableBody");
    let new_tbody = document.createElement('tbody');
    new_tbody.id = "tableBody";
    table.parentNode.replaceChild(new_tbody, table);
  
  
    //items.sort((a, b) => new Date(b.date) - new Date(a.date));
    items.for
    for (let i = items.length - 1; i >= 0; i--) {
      let item = items[i];
      let row = new_tbody.insertRow();
      let date = row.insertCell(0);
      date.innerHTML = item.date;
      let flow = row.insertCell(1);
      flow.innerHTML = item.waterFlow;
      let dayFlow = row.insertCell(2);
      dayFlow.innerHTML = Math.round(item.waterFlow * 3600 * 24)
    }
  }
  else {
    downloadTableButton.style.visibility = "hidden";
  }
}

function drawGraph(items) {
  
  if (barChart) {
    barChart.destroy();
  }

  if (items.length == 0) {
    downloadChartButton.style.visibility = "hidden";
    return;
  }



  downloadChartButton.style.visibility = "visible";

  const labels = items.map(i => i.date);
  const values = items.map(i => i.waterFlow);
  
  let dateString = "Datum";

  if (dateType == "Årsvärden") {
    dateString = "År";
  }

  //const ctxLine = document.getElementById("lineChart").getContext('2d');
  const ctxBar = document.getElementById("barChart").getContext('2d');

  //lineChart = createChart("line", ctxLine, labels, values, dateString)
  barChart = createChart("bar", ctxBar, labels, values, dateString);
}

function createChart(chartType, ctx, labels, values, dateString) {
  return new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: 'Vattenföring [m³/s]',
        data: values,
        backgroundColor: "#456882",
        fill: true,
        response: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: dateString
          }
        },
        y: {
          title: {
            display: true,
            text: 'Vattenföring [m³/s]'
          }
        }
      }
    }
  });
}

function downloadChart() {
  const chartCanvas = document.getElementById("barChart"); // Replace with your chart's canvas ID
  const url = chartCanvas.toDataURL("image/png"); // Can also be 'image/jpeg'

  const link = document.createElement("a");
  link.href = url;
  link.download = currentId + ".png";
  link.click();
  link.destroy();
}


function displayInformation(id, name, mainCatchmentBasin, area) {
  currentId = id;
  areaId.textContent = id;
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

function loadMap(lat, long) {

  if (map) {
    map.remove();
  }

  map = L.map('map').setView([lat, long], 10);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  L.marker([lat, long]).addTo(map);

  mapContainer.style.visibility = "visible"
}

function downloadCSV() {
  const table = document.getElementById("flowTable");
  const rows = Array.from(table.querySelectorAll("tr"));
  const csv = [];

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th, td"));
    const rowText = cells.map(cell => {
      const text = cell.innerText.replace(/"/g, '""'); // escape quotes
      return `"${text}"`;
    }).join(",");
    csv.push(rowText);
  }

  const csvContent = csv.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = currentId + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
