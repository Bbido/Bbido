const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

module.exports = app;
