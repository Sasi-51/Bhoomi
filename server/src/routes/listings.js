const express = require('express');
const { v4: uuid } = require('uuid');
const { store, CROPS } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { gradeProduce } = require('../agents/gradingAgent');

const router = express.Router();

router.get('/crops', (req, res) => res.json({ crops: CROPS }));

router.get('/', (req, res) => {
  const { crop, status } = req.query;
  let listings = store.all('listings');
  if (crop) listings = listings.filter((l) => l.crop === crop);
  if (status) listings = listings.filter((l) => l.status === status);

  const withFarmer = listings.map((l) => {
    const farmer = store.find('users', (u) => u.id === l.farmerId);
    return { ...l, farmerName: farmer ? farmer.name : 'Unknown', farmerLocation: farmer ? farmer.location : null };
  });

  res.json({ listings: withFarmer.sort((a, b) => b.createdAt - a.createdAt) });
});

router.get('/:id', (req, res) => {
  const listing = store.find('listings', (l) => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json({ listing });
});

router.post('/', requireAuth, requireRole('farmer'), (req, res) => {
  const { crop, quantityKg, askPrice, sizeScore, colorScore, defectScore } = req.body;

  if (!crop || !CROPS.includes(crop)) return res.status(400).json({ error: `crop must be one of: ${CROPS.join(', ')}` });
  if (!quantityKg || quantityKg <= 0) return res.status(400).json({ error: 'quantityKg must be a positive number' });
  if (!askPrice || askPrice <= 0) return res.status(400).json({ error: 'askPrice must be a positive number' });

  const { grade, gradeScore } = gradeProduce({
    sizeScore: Number(sizeScore) || 70,
    colorScore: Number(colorScore) || 70,
    defectScore: Number(defectScore) || 15
  });

  const listing = {
    id: uuid(),
    farmerId: req.user.id,
    crop,
    quantityKg: Number(quantityKg),
    askPrice: Number(askPrice),
    grade,
    gradeScore,
    status: 'active',
    createdAt: Date.now()
  };
  store.insert('listings', listing);
  res.status(201).json({ listing });
});

module.exports = router;
