
const earliestDate = "2010-01-01";

const url = "http://localhost:7007/fetch-excel"

const idField = document.getElementById("idField")
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const areaId = document.getElementById("areaId")
const areaName = document.getElementById("areaName");
const basinName = document.getElementById("basinName");
const areaText = document.getElementById("area");

var dateType = "Årsvärden"

var lineChart;
var barChart;

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
      console.log("data:", result.data)
      loadTable(result.data);
      displayInformation(result.id, result.name, result.main_catchment_basin, result.area);
      drawGraph(result.data);
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

  //items.sort((a, b) => new Date(b.date) - new Date(a.date));
  items.for
  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    let row = new_tbody.insertRow();
    let date = row.insertCell(0);
    date.innerHTML = item.date;
    let flow = row.insertCell(1);
    flow.innerHTML = item.waterFlow
    let dayFlow = row.insertCell(2);
    dayFlow.innerHTML = Math.round(item.waterFlow * 3600 * 24)
  }
}

function drawGraph(items) {

  if (barChart) {
    barChart.destroy();
  }

  if (items.length == 0) {
    return;
  }

  const labels = items.map(i => i.date);
  const values = items.map(i => i.waterFlow);
  
  var dateString = "Datum";

  if (dateType == "Årsvärden") {
    dateString = "År";
  }

  //const ctxLine = document.getElementById("lineChart").getContext('2d');
  const ctxBar = document.getElementById("barChart").getContext('2d');

  //lineChart = createChart("line", ctxLine, labels, values, dateString)
  barChart = createChart("bar", ctxBar, labels, values, dateString)
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


function displayInformation(id, name, mainCatchmentBasin, area) {
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