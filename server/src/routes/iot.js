const express = require('express');
const { store } = require('../db');

const router = express.Router();

router.get('/shipments', (req, res) => {
  res.json({ shipments: store.all('shipments') });
});

router.get('/shipments/:id', (req, res) => {
  const shipment = store.find('shipments', (s) => s.id === req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  res.json({ shipment });
});

module.exports = router;
