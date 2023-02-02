// Base URL for API calls: http://xmlopen.rejseplanen.dk/bin/rest.exe/


// Finds all locations with the input of Ringsted St.

// http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=Ringsted%20St.


// Find all departures from the given id(station) and date & time, also removes all results from busses
// http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=008600611&date=27.01.2023&time=11:52&useBus=0

const inputField = document.querySelector("#Station");
const resultFor = document.querySelector('#result-for')
const list = document.querySelector('#results-list');
// const showMoreBtn = document.querySelector("#show-more-btn");

let stopNames;
const input = document.querySelector('input');
input.addEventListener('input', debounce(async function () {

  // If input.value.length is greater than 3 it can diffrent stops, the user can click the button to generate more stops
  if (input.value.length < 3) {
    list.style.display = 'none';

    return;
  }

  // fetches data with await, and gets all stopNames
  const response = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${input.value}&format=json`);
  const data = await response.json();
  stopNames = data.LocationList.StopLocation.map(result => result.name);
  list.innerHTML = "";

  // makes the list visibil when input box is pressed
  list.style.display = 'block';


  let displayedResult = Array.from(stopNames.slice(0, 10));
  displayedResult.forEach((result) => {
    let item = document.createElement("li");
    item.innerText = result;
    list.appendChild(item);
  });

  list.addEventListener('click', (event) => {
    console.log('Click event fired');
    console.log('Target: ', event.target);

    if (event.target.tagName === 'LI') {
      console.log('Text content: ', event.target.textContent);
      inputField.value = event.target.textContent;

      // hides the list when user selects an option
      list.style.display = 'none';
    }

  });

  // Click eventlistener for showing more stops
  // showMoreBtn.addEventListener("click", (event) => {
  //   fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${input.value}&format=json`)
  //     .then((response) => response.json())
  //     .then((data) => {
  //       let results = data.LocationList.StopLocation.map(result => result.name);
  //       const currentResults = list.querySelectorAll("li");
  //       const startIndex = currentResults.length;
  //       let endIndex = startIndex + 10;
  //       results = Array.from(results.slice(startIndex, endIndex)); // Show next 10 results
  //       results.forEach((result) => {
  //         const item = document.createElement("li");
  //         item.innerText = result;
  //         list.appendChild(item);
  //       })
  //     });
  // });


  // Render the results to the page
}, 100));

// Debounce function to limit the number of API calls
function debounce(fn, delay) {
  let timer = null;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}



async function searchJourney() {

  const station = document.getElementById("Station").value;
  //  rawdate example: 2023-01-31T11:08 
  const rawdate = document.getElementById("Date").value;
  // converts the rawdate to the correct date format from YYYY-MM-DD to DD-MM-YYYY using the substring method
  const dd = rawdate.substring(8, 10);
  const mm = rawdate.substring(5, 7);
  const yyyy = rawdate.substring(0, 4);

  // converts 2023-01-31 to 31-01-2023
  const date = `${dd}-${mm}-${yyyy}`;

  // string for the the in the format of 00:00
  const time = rawdate.substring(11, 16);
  let stationId = "";
  fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${station}`)
    .then(response => response.text())
    .then(data => {
      const parser = new DOMParser();
      const xlm = parser.parseFromString(data, "text/xml");

      stationId = xlm.getElementsByTagName("StopLocation")[0].getAttribute("id");
      stationName = xlm.getElementsByTagName("StopLocation")[0].getAttribute("name");
      console.log(stationName);
      if (resultFor.textContent.trim()) {
        resultFor.textContent = "";
      }
      const result_for = document.createElement('h4');
      result_for.innerText = `Viser resultater for ${stationName}`;
      resultFor.appendChild(result_for);
      console.log(`First element for search: ${station} is ${stationId}`);
      console.log(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&format=json`);
      getTrainData(stationId, date, time);
      getBusData(stationId, date, time);
      getMetroData(stationId, date, time);
    })
    .catch(error => console.error(error));

  // Show Bus
  // http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useTog=0&useMetro=0&format=json
  // Show Metro
  // http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useTog=0&useBus=0&format=json
  // Show Tog
  // http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useMetro=0&format=json


}
async function getTrainData(stationId, date, time) {

  const train = document.querySelector("#train");
  const trainIC = document.querySelector('#trainIC');
  const trainRE = document.querySelector('#trainRE');
  const train_s = document.querySelector('#train-s');
  const traintog = document.querySelector('#tog');
  const trainResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useMetro=0&format=json`);
  const trainData = await trainResponse.json();
  if (trainData.DepartureBoard.Departure == 0 || trainData.DepartureBoard.Departure == null) {
    console.log("No train data found for this stop");
    if (train.textContent.trim()) {
      while (train.firstChild) {
        train.removeChild(element.firstChild);
      }
    }
    removeOld(trainIC);
    removeOld(trainRE);
    removeOld(train_s);
    removeOld(traintog);
  }
  else {

    try {
      if (train.textContent.trim()) {
        while (train.firstChild) {
          train.removeChild(element.firstChild);
        }
      }
      removeOld(trainIC);
      removeOld(trainRE);
      removeOld(train_s);
      removeOld(traintog);
      const array = trainData.DepartureBoard.Departure;
      const hr = document.createElement("hr");

      for (const t of array) {

        switch (t.type) {
          case 'IC':
            const ic = document.createElement('p');
            ic.innerText = `${t.name} ${t.time} ${t.direction}`;
            trainIC.appendChild(ic);
            break;
          case 'REG':
            const reg = document.createElement('p');
            reg.innerText = `${t.name} ${t.time} ${t.direction}`;
            trainRE.appendChild(reg);
            break;
          case 'S':
            const s =  document.createElement('p')
            s.innerText = `${t.name} ${t.time} ${t.direction}`;
            train_s.appendChild(s);
            break;
          case 'TOG':
            const tog = document.createElement('p');
            tog.innerText = `${t.name} ${t.time} ${t.direction}`;
            traintog.appendChild(tog);
            break;
          default:
            break;
        }
      }


      if (trainIC.innerHTML !== "" || trainRE.innerHTML !== "" || train_s.innerHTML !== "" || traintog.innerHTML !== "" ) {
        let trainHeader = createElement("h1", "Tog");
        train.insertBefore(trainHeader, train.firstChild)
      }
      if (trainIC.innerHTML !== "") {
        let icHeader = createElement("h4", "Intercity");
        trainIC.insertBefore(icHeader, trainIC.firstChild);
      }
      if (trainRE.innerHTML !== "") {
        let regHeader = createElement("h4", "Regional");
        trainRE.insertBefore(regHeader, trainRE.firstChild);
      }
      if (train_s.innerHTML !== "") {
        let sHeader = createElement("h4", "S-tog");
        train_s.insertBefore(sHeader, train_s.firstChild);
      }
      if (traintog.innerHTML !== "") {
        let togHeader = createElement("h4", "Øvrige tog");
        traintog.insertBefore(togHeader, traintog.firstChild);
      }


    } catch (error) {

    }
  }
}

async function getBusData(stationId, date, time) {
  const bus = document.querySelector("#bus");
  const busResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useTog=0&useMetro=0&format=json`);
  const busData = await busResponse.json();
  if (busData.DepartureBoard.Departure == 0 || busData.DepartureBoard.Departure == null) {
    console.log("No bus data found for this stop")
    removeOld(bus);
  }

  else {
    try {
      removeOld(bus);
      const array = busData.DepartureBoard.Departure;
      const h2 = document.createElement("h2");
      h2.innerText = "Bus";
      h2.id = "tmp"
      bus.appendChild(h2)
      for (const b of array) {
        const paragraph = document.createElement("p");
        paragraph.innerText = `${b.name} Tid: ${b.time} Retning: ${b.direction}`;
        bus.appendChild(paragraph);
      }
      const hr = document.createElement("hr");
      bus.appendChild(hr);
    } catch (error) {

    }
  }
}
async function getMetroData(stationId, date, time) {
  const metro = document.querySelector("#metro");
  const metroResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useTog=0&format=json`);
  console.log(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useTog=0&format=json`);
  const metroData = await metroResponse.json();
  if (metroData.DepartureBoard.Departure == 0 || metroData.DepartureBoard.Departure == null) {
    console.log("No metro data found for this stop")
    removeOld(metro)
  }

  else {
    try {
      removeOld(metro)
      const array = metroData.DepartureBoard.Departure;
      const h2 = document.createElement("h2");
      h2.innerText = "Metro";
      h2.id = "tmp"
      metro.appendChild(h2)
      for (const m of array) {
        const paragraph = document.createElement("p");
        paragraph.innerText = `${m.name} Tid: ${m.time} Retning: ${m.direction}`;
        metro.appendChild(paragraph);
      }
      const hr = document.createElement("hr");
      metro.appendChild(hr);
    } catch (error) {
      //console.error(error);
    }
  }
}


function removeOld(element) {
  if (element.textContent.trim()) {
    element.textContent = "";
  }
}
function createElement(elementType, innerText) {
  let element = document.createElement(elementType);
  element.innerText = innerText;
  return element;
}