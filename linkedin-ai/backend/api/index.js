require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const loaded = [];
const errors = [];

try { require('../src/routes/auth'); loaded.push('auth'); }
catch(e) { errors.push({ route: 'auth', error: e.message }); }

try { require('../src/routes/generate'); loaded.push('generate'); }
catch(e) { errors.push({ route: 'generate', error: e.message }); }

try { require('../src/routes/usage'); loaded.push('usage'); }
catch(e) { errors.push({ route: 'usage', error: e.message }); }

try { require('../src/routes/checkout'); loaded.push('checkout'); }
catch(e) { errors.push({ route: 'checkout', error: e.message }); }

try { require('../src/routes/webhook'); loaded.push('webhook'); }
catch(e) { errors.push({ route: 'webhook', error: e.message }); }

app.get('/api/health', (req, res) => res.json({ ok: true, loaded, errors }));
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

module.exports = app;
