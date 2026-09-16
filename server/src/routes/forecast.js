const express = require('express');
const { store, CROPS } = require('../db');
const { statisticalForecast, askForecastAgent } = require('../agents/forecastAgent');

const router = express.Router();

router.get('/:crop', (req, res) => {
  const { crop } = req.params;
  if (!CROPS.includes(crop)) return res.status(400).json({ error: `crop must be one of: ${CROPS.join(', ')}` });
  const series = store.data.mandiHistory[crop];
  res.json({ history: series, forecast: statisticalForecast(crop, series) });
});

router.post('/query', async (req, res) => {
  const { crop, question } = req.body;
  if (!crop || !CROPS.includes(crop)) return res.status(400).json({ error: `crop must be one of: ${CROPS.join(', ')}` });

  const result = await askForecastAgent({ crop, question, history: store.data.mandiHistory });
  res.json(result);
});

module.exports = router;
