// Base URL for API calls: http://xmlopen.rejseplanen.dk/bin/rest.exe/


// Finds all locations with the input of Ringsted St.

// http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=Ringsted%20St.


// Find all departures from the given id(station) and date & time, also removes all busses from results
// http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=008600611&date=27.01.2023&time=11:52&useBus=0


// Gets the HTML div from the id
const inputField = document.querySelector("#Station");
const resultFor = document.querySelector('#result-for')
const list = document.querySelector('#results-list');

// Empty variable to hold the stop/station names
let stopNames;

// Eventlistener for each time there is made an input action inside the input field
const input = document.querySelector('input');
input.addEventListener('input', debounce(async function () {

  // If input.value.length is less than 3 it can't show stops
  if (input.value.length < 3) {
    list.style.display = 'none';
    return;
  }

  // Fetches data with await, and gets all stopNames
  const response = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${input.value}&format=json`);
  const data = await response.json();

  // Using map to find the specific name in the json format
  stopNames = data.LocationList.StopLocation.map(result => result.name);

  // Resets the list to empty, or else each time an input is made the list would keep the old data
  list.innerHTML = "";

  // Makes the list visible
  list.style.display = 'block';

  // Only displays 10 results in the suggestion box using the slice method
  let displayedResult = Array.from(stopNames.slice(0, 10));

  // Adds the 10 results into the list
  displayedResult.forEach((result) => {
    let item = document.createElement("li");
    item.innerText = result;
    list.appendChild(item);
  });

  // Render the results to the page
}, 100));

// Eventlistener on list with an click, replaces inputField value with the clicked content in the list
list.addEventListener('click', (event) => {
  if (event.target.tagName === 'LI') {
    inputField.value = event.target.textContent;

    // To see what the user has clicked on in the console, then log event.target
    // console.log(event.target.textContent);
    // console.log(event.target);

    // Hides the list when user selects an option
    list.style.display = 'none';
  }
});

// Debounce function to limit the number of API calls
function debounce(fn, delay) {
  let timer = null;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

// This function is used to get and display data
async function searchJourney() {

  // Gets the text content inside the #station input field
  const station = document.getElementById("Station").value;

  // Rawdate example: 2023-01-31T11:08 
  const rawdate = document.getElementById("Date").value;

  // Converts the rawdate to the correct date format from YYYY-MM-DD to DD-MM-YYYY using the substring method
  const dd = rawdate.substring(8, 10);
  const mm = rawdate.substring(5, 7);
  const yyyy = rawdate.substring(0, 4);

  // Converts 2023-01-31 to 31-01-2023
  const date = `${dd}-${mm}-${yyyy}`;

  // String for the the in the format of 00:00
  const time = rawdate.substring(11, 16);

  // Empty variable
  let stationId = "";

  // Fetch data
  fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${station}`)
    .then(response => response.text())
    .then(data => {
      const parser = new DOMParser();
      const xlm = parser.parseFromString(data, "text/xml");

      // Gets specific id and name from the fetched data
      stationId = xlm.getElementsByTagName("StopLocation")[0].getAttribute("id");
      stationName = xlm.getElementsByTagName("StopLocation")[0].getAttribute("name");

      // removes old data
      removeOld(resultFor)

      // display the currenct searched stop/station
      const result_for = document.createElement('h4');
      result_for.innerText = `Viser resultater for ${stationName}`;
      resultFor.appendChild(result_for);

      // Runs 3 async functions to get the data for each type of transportation option
      getTrainData(stationId, date, time);
      getBusData(stationId, date, time);
      getMetroData(stationId, date, time);
    })
    .catch(error => console.error(error));

  // Get 20 results from Bus
  // http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useTog=0&useMetro=0&format=json
  // Get 20 results from Metro
  // http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useTog=0&useBus=0&format=json
  // Get 20 results from Tog
  // http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useMetro=0&format=json


}
// Get train data
async function getTrainData(stationId, date, time) {

  // Gets the HTML div from the id
  const trainIC = document.querySelector('#trainIC');
  const trainRE = document.querySelector('#trainRE');
  const train_s = document.querySelector('#train-s');
  const trainLyn = document.querySelector('#trainLyn');
  const trainLet = document.querySelector('#trainLet')
  const traintog = document.querySelector('#tog');

  // Fetches data with await, and gets all departures from the given parameters
  const trainResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useMetro=0&format=json`);
  const trainData = await trainResponse.json();

  // Remove old data
  removeOld(trainIC);
  removeOld(trainRE);
  removeOld(train_s);
  removeOld(traintog);
  removeOld(trainLyn);
  removeOld(trainLet);

  // If there is no train data
  if (trainData.DepartureBoard.Departure == 0 || trainData.DepartureBoard.Departure == null) {
    // Do nothing
  }

  // Try catch for an for-loop to loop each item in the array
  else {
    try {
      let array = trainData.DepartureBoard.Departure;
      for (let t of array) {

        // Switch case to format each type of train correctly
        switch (t.type) {
          case 'IC':
            const ic = document.createElement('p');
            ic.innerHTML = `<span id="colorTrainIC">${t.name}</span> → <strong>${t.direction}</strong> | ${t.time} - ${t.date}`;
            trainIC.appendChild(ic);
            break;
          case 'REG':
            const reg = document.createElement('p');
            reg.innerHTML = `<span id="colorTrainREG">${t.name}</span> → <strong>${t.direction}</strong> | ${t.time} - ${t.date}`;
            trainRE.appendChild(reg);
            break;
          case 'S':
            const s = document.createElement('p');
            s.innerHTML = `<span id="colorTrainS">${t.name}</span> → <strong>${t.direction}</strong> | ${t.time} - ${t.date}`;
            train_s.appendChild(s);
            break;
          case 'LYN':
            const lyn = document.createElement('p');
            lyn.innerHTML = `<span id="colorTrainLYN">${t.name}</span> → <strong>${t.direction}</strong> | ${t.time}  - ${t.date}`;
            trainLyn.appendChild(lyn);
            break;
          case 'LET':
            const letTrain = document.createElement('p');
            letTrain.innerHTML = `<span id="colorTrainOther">${t.name}</span> → <strong>${t.direction}</strong> | ${t.time}  - ${t.date}`;
            trainLet.appendChild(letTrain);
            break;
          case 'F':
            // Do nothing
            break;
          default:
            const tog = document.createElement('p');
            tog.innerHTML = `<span id="colorTrainOther">${t.name}</span> → <strong>${t.direction}</strong> | ${t.time}  - ${t.date}`;
            traintog.appendChild(tog);
            break;
        }
      }

      // add header text for each train option if they have any content
      addHeaderText(trainIC, "Intercity");
      addHeaderText(trainRE, "Regional");
      addHeaderText(train_s, "S-tog");
      addHeaderText(trainLyn, "Lyn-tog");
      addHeaderText(trainLet, "Letbane");
      addHeaderText(traintog, "Øvrige tog");

    } catch (error) {
      console.log(error);
    }
  }
}
// Get bus data
async function getBusData(stationId, date, time) {

  // Gets the HTML div from the id
  const bus = document.querySelector("#busBus");
  const exp = document.querySelector("#busExb");
  const other = document.querySelector("#busOther");

  // Fetches data with await, and gets all departures from the given parameters
  const busResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useTog=0&useMetro=0&format=json`);
  const busData = await busResponse.json();

  // Remove old data
  removeOld(bus);
  removeOld(exp);
  removeOld(other);

  // If there is no bus data
  if (busData.DepartureBoard.Departure == 0 || busData.DepartureBoard.Departure == null) {
    // Do nothing
  }

  // Try catch for an for-loop to loop each item in the array
  else {
    try {
      const array = busData.DepartureBoard.Departure;
      for (const b of array) {
        // Switch case to format each type of bus correctly
        switch (b.type) {
          case 'BUS':
            const busBus = document.createElement('p');
            busBus.innerHTML = `<span id="colorBus">${b.name}</span> → <strong>${b.direction}</strong> | ${b.time} - ${b.date}`;
            bus.appendChild(busBus);
            break;
          case 'EXB':
            const busExp = document.createElement('p');
            busExp.innerHTML = `<span id="colorBus">${b.name}</span> → <strong>${b.direction}</strong> | ${b.time} - ${b.date}`;
            exp.appendChild(busExp);
            break;
          case 'LET':
            // Do nothing
            break;
          case 'F':
            // Do nothing
            break;
          default:
            const busOther = document.createElement('p');
            busOther.innerHTML = `<span id="colorBusOther">${b.name}</span> → <strong>${b.direction}</strong> | ${b.time} - ${b.date}`;
            other.appendChild(busOther);
            break;
        }
      }

      // add header text for each bus option if they have any content
      addHeaderText(bus, "Bus");
      addHeaderText(exp, "Expressbus");
      addHeaderText(other, "Øvrige Busser");

    } catch (error) {
      console.log(error);
    }
  }
}

// Get metro data
async function getMetroData(stationId, date, time) {

  // Gets the HTML div from the id
  const metro = document.querySelector("#metroMetro");
  const other = document.querySelector('#metroOther');
  const boat = document.querySelector('#boat')

  // Fetches data with await, and gets all departures from the given parameters
  const metroResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useTog=0&format=json`);
  const metroData = await metroResponse.json();

  // Remove old data
  removeOld(metro);
  removeOld(other);
  removeOld(boat);

  // If there is no bus data
  if (metroData.DepartureBoard.Departure == 0 || metroData.DepartureBoard.Departure == null) {
    // Do nothing
  }

  // Try catch for an for-loop to loop each item in the array
  else {
    try {
      const array = metroData.DepartureBoard.Departure;
      for (const m of array) {
        switch (m.type) {
          case 'M':
            const metroMetro = document.createElement('p');
            metroMetro.innerHTML = `<span id="colorMetro">${m.name}</span> → <strong>${m.direction}</strong> | ${m.time} - ${m.date}`;
            metro.appendChild(metroMetro);
            break;
          case 'LET':
            // Do nothing
            break;
          case 'F':
            const boatTrip = document.createElement('p');
            boatTrip.innerHTML = `<span id="colorMetro">${m.name}</span> → <strong>${m.direction}</strong> | ${m.time} - ${m.date}`;
            boat.appendChild(boatTrip);
            break;
          default:
            const metroOther = document.createElement('p');
            metroOther.innerHTML = `<span id="colorMetro">${m.name}</span> → <strong>${m.direction}</strong> | ${m.time} - ${m.date}`;
            other.appendChild(metroOther);
            break;
        }
      }

      // add header text for each train option if they have any content
      addHeaderText(metro, "Metro");
      addHeaderText(boat, "Færge");
      addHeaderText(other, "Øvrige metro");

    } catch (error) {
      console.error(error);
    }
  }
}

// I made this function to prevent redundancy
// This function takes in 2 parameters 
// The first is the HTML div element
// The second is the text inside the element
function addHeaderText(element, innerText) {

  // Checks if it's not empty
  if (element.innerHTML !== "") {

    // Makes and hr element to make an like under the div
    const hr = document.createElement("hr");
    element.appendChild(hr)

    // Gives the div an "Title" and inserts before the first item in the div
    const elementHeader = document.createElement("h4");
    elementHeader.innerText = innerText;
    element.insertBefore(elementHeader, element.firstChild);
  }
}
// I made this function to prevent reduncancy
// This function takes in 1 parameter
function removeOld(element) {

  // Checks if the elements textcontent isn't empty
  if (element.textContent !== "") {

    // Makes textContent empty
    element.textContent = "";
  }
}
