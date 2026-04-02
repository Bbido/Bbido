require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('../src/routes/auth');
const generateRoutes = require('../src/routes/generate');
const usageRoutes = require('../src/routes/usage');
const checkoutRoutes = require('../src/routes/checkout');
const webhookRoutes = require('../src/routes/webhook');

const app = express();

app.use(cors({ origin: '*' }));

// Stripe webhook needs raw body
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
}));

app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, version: '1.0.0' }));

module.exports = app;
