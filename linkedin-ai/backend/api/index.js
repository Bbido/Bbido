require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.get('*', (req, res) => {
  res.json({
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    matchedPath: req.headers['x-matched-path'],
    nowRoutes: req.headers['x-now-route-matches'],
    forwardedHost: req.headers['x-forwarded-host'],
    allHeaders: Object.keys(req.headers)
  });
});

module.exports = app;
