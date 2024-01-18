const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Papa = require('papaparse');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


// Function to load and parse CSV data
function loadCsvData(filePath) {
    const csvFile = fs.readFileSync(filePath, 'utf8');
    return Papa.parse(csvFile, { header: true, skipEmptyLines: true }).data;
}

const filePath = path.join(process.cwd(),'data', 'Compatibility Checker Data - Raw Data.csv');
const csvData = loadCsvData(filePath);

app.get('/', (req, res) => {
    res.render('index', { compatibilityInfo: null,
                          bike_model: null,
                          soft_spot_f: null,
                          soft_spot_r: null,
                          accessory1: null,
                          accessory2: null,
                          accessory3: null,
                          accessory4: null,
                          accessory5: null,
                          num_passengers: null});
});

// Route to handle form submission
app.post('/', (req, res) => {
    const bikeModel = req.body.bike_model;
    const softSpotF = req.body.soft_spot_f || '';
    const softSpotR = req.body.soft_spot_r || '';
    const accessories = req.body.accessories || []; 
    let numPassengers = parseInt(req.body.num_passengers || '0', 10);

    let selectedConfiguration = {};

    if (softSpotF) {
        selectedConfiguration['Soft Spot (F)'] = softSpotF;
    }

    if (softSpotR) {
        selectedConfiguration['Soft Spot (R)'] = softSpotR;
    }

    accessories.forEach((accessory, index) => {
        if (accessory) {
            selectedConfiguration[`Accessory ${index + 1}`] = accessory;
        }
    });

    if (numPassengers) {
        selectedConfiguration['No of Passengers'] = numPassengers;
    }

    console.log(bikeModel);
    console.log(softSpotF);
    console.log(softSpotR);
    console.log(accessories[0]);
    console.log(accessories[1]);
    console.log(accessories[2]);
    console.log(accessories[3]);
    console.log(accessories[4]);
    console.log(numPassengers);

    const compatibilityInfo = getCompatibilityInfo(csvData, selectedConfiguration, bikeModel);
    console.log(compatibilityInfo);

    res.render('index', { compatibilityInfo: compatibilityInfo,
                          bike_model: bikeModel,
                          soft_spot_f: softSpotF,
                          soft_spot_r: softSpotR,
                          accessory1: accessories[0],
                          accessory2: accessories[1],
                          accessory3: accessories[2],
                          accessory4: accessories[3],
                          accessory5: accessories[4],
                          num_passengers: numPassengers
                        });
});

function getCompatibilityInfo(data, selectedConfiguration, bikeModel) {
    let filteredData = data.filter(row => {
        return Object.keys(selectedConfiguration).every(key => {
            if (key !== 'No of Passengers') {
                if (selectedConfiguration[key] === 'NaN') { 
                    return row[key] === undefined || row[key] === null || row[key] === '';
                } else {
                    return selectedConfiguration[key] === row[key];
                }
            }
            return true;
        });
    });

    const numPassengers = parseInt(selectedConfiguration['No of Passengers'] || '1', 10);
    
    if (numPassengers === 1) {
        let filteredDataFor2Passengers = filteredData.filter(row => row['No of Passengers'] === '2');
        if (filteredDataFor2Passengers.some(row => row[bikeModel] === 'N')) {
            return 'Yes, the configuration is possible.';
        }
    }

    filteredData = filteredData.filter(row => row['No of Passengers'].toString() === numPassengers.toString());

    if (filteredData.length > 0) {
        if (filteredData[0][bikeModel] === 'N') {
            return 'No, the configuration is not possible.';
        }

        if (filteredData[0][bikeModel].includes('Y')) {
            return 'Yes, the configuration is possible.';
        }

    } else {
        return "Configuration not found or not compatible";
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


module.exports = app;