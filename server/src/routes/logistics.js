const express = require('express');
const { optimizeRoute } = require('../agents/logisticsAgent');

const router = express.Router();

const HUB = { lat: 19.9975, lng: 73.7898, label: 'Nashik consolidation hub' };
const DEMO_STOPS = [
  { lat: 20.15, lng: 74.05, label: 'Farm A - Sinnar' },
  { lat: 19.85, lng: 73.95, label: 'Farm B - Niphad' },
  { lat: 20.05, lng: 74.25, label: 'Farm C - Yeola' }
];
const DEMO_BUYER = { lat: 17.385, lng: 78.4867, label: 'Buyer - Hyderabad' };

// Illustrative endpoint for the dashboard's route visualisation panel.
router.get('/demo', (req, res) => {
  const result = optimizeRoute({ hub: HUB, stops: DEMO_STOPS, destination: DEMO_BUYER });
  res.json(result);
});

// Real optimisation endpoint - pass your own stops.
router.post('/optimize', (req, res) => {
  const { hub, stops, destination } = req.body;
  if (!hub || !Array.isArray(stops) || !stops.length || !destination) {
    return res.status(400).json({ error: 'hub, stops[] and destination are required, each as {lat, lng, label}' });
  }
  res.json(optimizeRoute({ hub, stops, destination }));
});

module.exports = router;
