const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data.json'));

const hours = data.map((item) => item.hours);

// remove duplicates from array
const uniqueHours = [...new Set(hours)];

console.log(uniqueHours);

// average of uniqueHours
const averageHours = uniqueHours.reduce((a, b) => a + b, 0) / uniqueHours.length;

console.log(averageHours);