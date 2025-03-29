require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', true);

const PORT = process.env.PORT || 8080;

const allowedOrigins = ['https://solar.clution.se', 'https://solar.local'];
// Move CORS middleware to top
app.use(
  cors({
    origin: function (origin, callback) {
      if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked request from origin: ${origin || 'Unknown'}`);
        return callback(null, false); // Return CORS-error instead of throwing an error
      }
    },
    methods: ['GET'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  })
);

// Log function
const logRequest = (req, res, next) => {
  const logFile = path.join(__dirname, 'api-logs.txt');
  const realIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Spara starttid
  const startTime = process.hrtime();

  res.on('finish', () => {
    // Beräkna hur lång tid requesten tog
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(3); // Omvandla till ms med 3 decimaler

    // Bygg loggmeddelande
    const logEntry = `${new Date().toISOString()} - ${req.method} ${
      req.url
    } - IP: ${realIp} - Origin: ${req.headers.origin || 'Unknown'} - Status: ${
      res.statusCode
    } - Duration: ${durationMs} ms\n`;

    // Skriv till loggfil
    fs.appendFile(logFile, logEntry, (err) => {
      if (err) console.error('Could not write to logfile', err);
    });

    console.log(logEntry.trim()); // Skriv ut i terminalen också
  });

  next();
};

// Log middleware after CORS
app.use(logRequest);

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token || token !== `Bearer ${process.env.ACCESS_TOKEN}`) {
    console.warn(
      `Failed auth from IP: ${req.ip} - Origin: ${
        req.headers.origin || 'Unknown'
      }`
    );
    return res.status(403).json({ error: 'Access denied!' });
  }
  next();
};

/* ROUTER */
// favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// API-endpoint to get specific key
app.get('/get-key', authenticate, (req, res) => {
  const start = process.hrtime.bigint(); // Starta timer (nanosekunder)
  let keyName, typeName;

  if (req.query.key) {
    keyName = req.query.key;
    typeName = 'KEY';
  } else if (req.query.url) {
    keyName = req.query.url;
    typeName = 'URL';
  } else {
    return res.status(400).json({ error: 'No key or URL specified!' });
  }

  // Create variable based on type
  const envKey = `${typeName}_${keyName.toUpperCase()}`;
  const apiKey = process.env[envKey];

  if (!apiKey) {
    return res.status(404).json({ error: 'Key was not found!' });
  }
  const end = process.hrtime.bigint(); // Slut tid (nanosekunder)
  const duration = Number(end - start) / 1e6; // Omvandla till millisekunder
  res.json({ apiKey, duration: duration.toFixed(4) });
});

// Start server
/*
ssh -p 2020 s82677@gkey.clution.se
source /home/s82677/nodevenv/domains/gkey.clution.se/public_html/20/bin/activate && cd /home/s82677/domains/gkey.clution.se/public_html
*/
app.listen(() => console.log(`Server is running (on port ${PORT})`));
