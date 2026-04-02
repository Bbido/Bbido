require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, step: 1 }));
app.get('/api/health', (req, res) => res.json({ ok: true, step: 1 }));

// Add routes one at a time - step 1: auth only
try {
  const authRoutes = require('../src/routes/auth');
  app.use('/api/auth', authRoutes);
  app.get('/health', (req, res) => res.json({ ok: true, step: 2, loaded: 'auth' }));
} catch(e) {
  app.get('/debug', (req, res) => res.json({ crashed: 'auth', error: e.message }));
}

try {
  const generateRoutes = require('../src/routes/generate');
  app.use('/api/generate', generateRoutes);
} catch(e) {
  app.get('/debug', (req, res) => res.json({ crashed: 'generate', error: e.message }));
}

try {
  const usageRoutes = require('../src/routes/usage');
  app.use('/api/usage', usageRoutes);
} catch(e) {
  app.get('/debug', (req, res) => res.json({ crashed: 'usage', error: e.message }));
}

try {
  const checkoutRoutes = require('../src/routes/checkout');
  app.use('/api/checkout', checkoutRoutes);
} catch(e) {
  app.get('/debug', (req, res) => res.json({ crashed: 'checkout', error: e.message }));
}

try {
  const webhookRoutes = require('../src/routes/webhook');
  app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);
} catch(e) {
  app.get('/debug', (req, res) => res.json({ crashed: 'webhook', error: e.message }));
}

app.get('/health', (req, res) => res.json({ ok: true, step: 'all loaded' }));
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

module.exports = app;
