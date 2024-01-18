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
app.use(express.static('public'));


// Function to load and parse CSV data
function loadCsvData(filePath) {
    const csvFile = fs.readFileSync(filePath, 'utf8');
    return Papa.parse(csvFile, { header: true, skipEmptyLines: true }).data;
}

const filePath = path.join(process.cwd(),'data', 'Compatibility Checker Data - Raw Data.csv');
const csvData = loadCsvData(filePath);

app.get('/', (req, res) => {
    res.render('index', { compatibilityInfo: null });
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

    console.log(selectedConfiguration);
    console.log(bikeModel);

    const compatibilityInfo = getCompatibilityInfo(csvData, selectedConfiguration, bikeModel);
    console.log(compatibilityInfo);

    res.render('index', { compatibilityInfo: compatibilityInfo});
});

function getCompatibilityInfo(data, selectedConfiguration, bikeModel) {
    let filteredData = data.filter(row => {
        return Object.keys(selectedConfiguration).every(key => {
            if (key !== 'No of Passengers') {
                if (selectedConfiguration[key] === 'NaN') { // Handle NaN values
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
            return 'Y';
        }
    }

    filteredData = filteredData.filter(row => row['No of Passengers'].toString() === numPassengers.toString());

    if (filteredData.length > 0) {
        return filteredData[0][bikeModel];
    } else {
        return "Configuration not found or not compatible";
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


module.exports = app;