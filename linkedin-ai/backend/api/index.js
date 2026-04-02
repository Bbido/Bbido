require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Debug - show exactly what path Vercel passes to Express
app.use((req, res, next) => {
  console.log('PATH:', req.path, 'URL:', req.url, 'METHOD:', req.method);
  next();
});

app.get('*', (req, res) => {
  res.json({
    ok: true,
    path: req.path,
    url: req.url,
    method: req.method
  });
});

module.exports = app;
