// Buyer demand board. Bidding on an existing listing assumes a buyer is
// browsing what's already there - fine for spot purchases, but bulk buyers
// (the other half of this problem statement) more often need a *standing*
// order: "500kg tomato, weekly, up to X/kg." This lets a buyer post that
// once and have farmers discover and fulfil it directly, instead of the
// buyer having to keep checking the marketplace.

const express = require('express');
const { v4: uuid } = require('uuid');
const { store, CROPS } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { crop, status = 'open' } = req.query;
  let demands = store.all('demands');
  if (status !== 'all') demands = demands.filter((d) => d.status === status);
  if (crop) demands = demands.filter((d) => d.crop === crop);

  const withBuyer = demands.map((d) => {
    const buyer = store.find('users', (u) => u.id === d.buyerId);
    return { ...d, buyerName: buyer ? buyer.name : 'Unknown' };
  });

  res.json({ demands: withBuyer.sort((a, b) => b.createdAt - a.createdAt) });
});

router.post('/', requireAuth, requireRole('buyer'), (req, res) => {
  const { crop, quantityKg, maxPricePerKg, notes } = req.body;

  if (!crop || !CROPS.includes(crop)) return res.status(400).json({ error: `crop must be one of: ${CROPS.join(', ')}` });
  if (!quantityKg || quantityKg <= 0) return res.status(400).json({ error: 'quantityKg must be a positive number' });
  if (!maxPricePerKg || maxPricePerKg <= 0) return res.status(400).json({ error: 'maxPricePerKg must be a positive number' });

  const demand = {
    id: uuid(),
    buyerId: req.user.id,
    crop,
    quantityKg: Number(quantityKg),
    maxPricePerKg: Number(maxPricePerKg),
    notes: notes || '',
    status: 'open',
    createdAt: Date.now()
  };
  store.insert('demands', demand);
  res.status(201).json({ demand });
});

router.post('/:id/close', requireAuth, (req, res) => {
  const demand = store.find('demands', (d) => d.id === req.params.id);
  if (!demand) return res.status(404).json({ error: 'Demand not found' });
  if (demand.buyerId !== req.user.id) return res.status(403).json({ error: 'Only the buyer who posted this can close it' });

  const updated = store.update('demands', demand.id, { status: 'closed' });
  res.json({ demand: updated });
});

module.exports = router;
