const axios = require('axios');
const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

// exchange strava code for access token
const exchangeCode = async (code) => {
  const response = await axios.post(
    'https://www.strava.com/api/v3/oauth/token',
    {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
    },
  ).catch((err) => {
    return new Error('Error exchanging code for access token');
  });
  return response.data;
};

// get athlete activites
const getActivities = async (accessToken) => {
  const response = await axios.get(
    'https://www.strava.com/api/v3/athlete/activities?after=1629097201?before=1631883599&per_page=200', // after in unix timestamp, per_page should just be large enough to get all activities
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  ).catch((err) => {
    return new Error('Error getting activities');
  });
  return response.data;
};

express()
  .get('/', (req, res) => {
    // send index.html
    res.sendFile(__dirname + '/index.html');
  })
  .get('/data', (req, res) => {
    exchangeCode(req.query.code)
      .then((data) => {
        getActivities(data.access_token)
          .then((activities) => {
            let seconds = 0;
            var meters_dist = 0;
            let meters_climb = 0;
            for (let i = 0; i < activities.length; i++) {
              seconds += activities[i].elapsed_time;
              meters_dist += activities[i].distance;
              meters_climb += activities[i].total_elevation_gain;
            }
            var miles = meters_dist / 1609.34;
            var hours = (seconds / 60) / 60;
            var feet = meters_climb * 3.28084;

            // redirect to ./sucess
            res.redirect(`https://strava.bhs.sh/success?miles=${miles}&hours=${hours}&feet=${feet}`);
            
            const anonData = JSON.parse(fs.readFileSync('data.json'));

            anonData.push({
              hours: hours.toFixed(2),
              miles: miles.toFixed(2),
              feet: feet.toFixed(2),
            });

            fs.writeFileSync('data.json', JSON.stringify(anonData));
          })
          .catch((err) => {
            console.log(err);
            res.send(err);
          });
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      });
  })
  .get('/tailwind.css', (req, res) => {
    res.sendFile(__dirname + '/tailwind.css');
  })
  .get('/success', (req, res) => {
    res.sendFile(__dirname + '/success.html');
  })
  .listen(1258, () => {
    console.log('listening on port 1258');
  });