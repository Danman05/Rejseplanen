// Base URL for API calls: http://xmlopen.rejseplanen.dk/bin/rest.exe/


// Finds all locations with the input of Ringsted St.

// http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=Ringsted%20St.


// Find all departures from the given id(station) and date & time, also removes all busses from results
// http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=008600611&date=27.01.2023&time=11:52&useBus=0

const inputField = document.querySelector("#Station");
const resultFor = document.querySelector('#result-for')
const list = document.querySelector('#results-list');


let stopNames;

const input = document.querySelector('input');
input.addEventListener('input', debounce(async function () {

  // If input.value.length is less than 3 it can't show stops
  if (input.value.length < 3) {
    list.style.display = 'none';
    return;
  }

  // fetches data with await, and gets all stopNames
  const response = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=${input.value}&format=json`);
  const data = await response.json();

  stopNames = data.LocationList.StopLocation.map(result => result.name);
  list.innerHTML = "";

  // makes the list visible when input box is pressed
  list.style.display = 'block';

  // Only displays 10 results in the suggestion box
  let displayedResult = Array.from(stopNames.slice(0, 10));
  displayedResult.forEach((result) => {
    let item = document.createElement("li");
    item.innerText = result;
    list.appendChild(item);
  });

  // Render the results to the page
}, 100));

list.addEventListener('click', (event) => {
  console.log('Click event fired');
  console.log('Target: ', event.target);

  if (event.target.tagName === 'LI') {
    console.log('Text content: ', event.target.textContent);
    inputField.value = event.target.textContent;

    // hides the list when user selects an option
    list.style.display = 'none';
    event.stopPropagation();
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

      if (resultFor.textContent.trim()) {
        resultFor.textContent = "";
      }
      const result_for = document.createElement('h4');
      result_for.innerText = `Viser resultater for ${stationName}`;
      resultFor.appendChild(result_for);

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
async function getTrainData(stationId, date, time) {

  const trainIC = document.querySelector('#trainIC');
  const trainRE = document.querySelector('#trainRE');
  const train_s = document.querySelector('#train-s');
  const trainLyn = document.querySelector('#trainLyn')
  const traintog = document.querySelector('#tog');

  const trainResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useMetro=0&format=json`);
  const trainData = await trainResponse.json();

  removeOld(trainIC);
  removeOld(trainRE);
  removeOld(train_s);
  removeOld(traintog);
  removeOld(trainLyn);

  if (trainData.DepartureBoard.Departure == 0 || trainData.DepartureBoard.Departure == null) {
    console.log("No train data found for this stop");
  }
  else {
    try {
      let array = trainData.DepartureBoard.Departure;
      for (let t of array) {
        switch (t.type) {
          case 'IC':
            const ic = document.createElement('p');
            ic.innerText = `${t.name} --> ${t.direction} | ${t.time}`;
            trainIC.appendChild(ic);
            break;
          case 'REG':
            const reg = document.createElement('p');
            reg.innerText = `${t.name} --> ${t.direction} | ${t.time}`;
            trainRE.appendChild(reg);
            break;
          case 'S':
            const s = document.createElement('p');
            s.innerText = `${t.name} --> ${t.direction} | ${t.time}`;
            train_s.appendChild(s);
            break;
          case 'LYN':
            const lyn = document.createElement('p');
            lyn.innerText = `${t.name} --> ${t.direction} | ${t.time}`;
            trainLyn.appendChild(lyn);
            break;
          default:
            const tog = document.createElement('p');
            tog.innerText = `${t.name} --> ${t.direction} | ${t.time}`;
            traintog.appendChild(tog);
            break;
        }
      }
      if (trainIC.innerHTML !== "") {
        const hrIc = document.createElement("hr");
        trainIC.appendChild(hrIc);
        let icHeader = createElement("h4", "Intercity");
        trainIC.insertBefore(icHeader, trainIC.firstChild);
      }
      if (trainRE.innerHTML !== "") {
        const hrRe = document.createElement("hr");
        trainRE.appendChild(hrRe);
        let regHeader = createElement("h4", "Regional");
        trainRE.insertBefore(regHeader, trainRE.firstChild);
      }
      if (train_s.innerHTML !== "") {
        const hrS = document.createElement("hr");
        train_s.appendChild(hrS);
        let sHeader = createElement("h4", "S-tog");
        train_s.insertBefore(sHeader, train_s.firstChild);
      }
      if (trainLyn.innerText !== "") {
        const hrLyn = document.createElement("hr");
        trainLyn.appendChild(hrLyn);
        let lynHeader = createElement("h4", "Lyn-tog");
        trainLyn.insertBefore(lynHeader, trainLyn.firstChild);
      }
      if (traintog.innerHTML !== "") {
        const hrOther = document.createElement("hr");
        traintog.appendChild(hrOther);
        let togHeader = createElement("h4", "Øvrige tog");
        traintog.insertBefore(togHeader, traintog.firstChild);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

async function getBusData(stationId, date, time) {

  const bus = document.querySelector("#busBus");
  const exp = document.querySelector("#busExb");
  const other = document.querySelector("#busOther");

  const busResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useTog=0&useMetro=0&format=json`);
  const busData = await busResponse.json();

  removeOld(bus);
  removeOld(exp);
  removeOld(other);

  if (busData.DepartureBoard.Departure == 0 || busData.DepartureBoard.Departure == null) {
    console.log("No bus data found for this stop");
  }
  else {
    try {
      const array = busData.DepartureBoard.Departure;
      for (const b of array) {
        switch (b.type) {
          case 'BUS':
            const busBus = document.createElement('p');
            busBus.innerText = `${b.name} --> ${b.direction} | ${b.time}`;
            bus.appendChild(busBus);
            break;
          case 'EXB':
            const busExp = document.createElement('p');
            busExp.innerText = `${b.name} --> ${b.direction} | ${b.time}`;
            exp.appendChild(busExp);
            break;
          default:
            const busOther = document.createElement('p');
            busOther.innerText = `${b.name} --> ${b.direction} | ${b.time}`;
            other.appendChild(busOther);
            break;
        }
      }
      if (bus.innerHTML !== "") {
        const hrBus = document.createElement("hr");
        bus.appendChild(hrBus);
        let busHeader = createElement("h4", "Bus");
        bus.insertBefore(busHeader, bus.firstChild);
      }
      if (exp.innerHTML !== "") {
        const hrExb = document.createElement("hr");
        exp.appendChild(hrExb);
        let exbHeader = createElement("h4", "Expressbus");
        exp.insertBefore(exbHeader, exp.firstChild);
      }
      if (other.innerHTML !== "") {
        const hrOther = document.createElement("hr");
        other.appendChild(hrOther);
        let otherHeader = createElement("h4", "Øvrige Busser");
        other.insertBefore(otherHeader, other.firstChild);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

async function getMetroData(stationId, date, time) {

  const metro = document.querySelector("#metroMetro");
  const other = document.querySelector('#metroOther');

  const metroResponse = await fetch(`http://xmlopen.rejseplanen.dk/bin/rest.exe/departureBoard?id=${stationId}&date=${date}&time=${time}&useBus=0&useTog=0&format=json`);
  const metroData = await metroResponse.json();

  removeOld(metro);

  if (metroData.DepartureBoard.Departure == 0 || metroData.DepartureBoard.Departure == null) {
    console.log("No metro data found for this stop");
  }
  else {
    try {
      const array = metroData.DepartureBoard.Departure;
      for (const m of array) {
        switch (m.type) {
          case 'M':
            const metroMetro = document.createElement('p');
            metroMetro.innerText = `${m.name} --> ${m.direction} | ${m.time}`;
            metro.appendChild(metroMetro);
            break;
          default:
            const metroOther = document.createElement('p');
            metroOther.innerText = `${m.name} --> ${m.direction} | ${m.time}`;
            other.appendChild(metroOther);
            break;
        }
      }
      if (metro.innerHTML !== "") {
        const hrMetro = document.createElement("hr");
        metro.appendChild(hrMetro);
        let metroHeader = createElement("h4", "Metro");
        metro.insertBefore(metroHeader, metro.firstChild);
      }
      if (other.innerHTML !== "") {
        const hrOther = document.createElement("hr");
        other.appendChild(hrOther);
        let otherHeader = createElement("h4", "Øvrige metro");
        other.insertBefore(otherHeader, other.firstChild);
      }
    } catch (error) {
      console.error(error);
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