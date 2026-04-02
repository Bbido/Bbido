require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('../src/routes/auth');
const generateRoutes = require('../src/routes/generate');
const usageRoutes = require('../src/routes/usage');
const checkoutRoutes = require('../src/routes/checkout');
const webhookRoutes = require('../src/routes/webhook');

const app = express();

app.use(cors({ origin: '*' }));

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, version: '1.0.0' }));
app.get('/health', (req, res) => res.json({ ok: true, version: '1.0.0' }));

app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/checkout', checkoutRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

module.exports = app;
