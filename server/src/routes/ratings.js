const express = require('express');
const { v4: uuid } = require('uuid');
const { store } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { summarizeRatings } = require('../agents/reputationAgent');
const { notify } = require('../utils/notify');

const router = express.Router();

router.get('/user/:userId', (req, res) => {
  const ratings = store.filter('ratings', (r) => r.ratedUserId === req.params.userId);
  const summary = summarizeRatings(ratings);
  const recent = [...ratings].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  res.json({ ...summary, recent });
});

router.post('/', requireAuth, (req, res) => {
  const { shipmentId, stars, comment } = req.body;

  if (!shipmentId) return res.status(400).json({ error: 'shipmentId is required' });
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'stars must be an integer from 1 to 5' });
  }

  const shipment = store.find('shipments', (s) => s.id === shipmentId);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  if (shipment.payment.status !== 'released') {
    return res.status(400).json({ error: 'You can only rate a transaction after payment has been released' });
  }

  const isBuyer = shipment.buyerId === req.user.id;
  const isFarmer = shipment.farmerId === req.user.id;
  if (!isBuyer && !isFarmer) return res.status(403).json({ error: 'You were not a party to this transaction' });

  const ratedUserId = isBuyer ? shipment.farmerId : shipment.buyerId;

  const existing = store.find('ratings', (r) => r.shipmentId === shipmentId && r.raterId === req.user.id);
  if (existing) return res.status(409).json({ error: 'You already rated this transaction' });

  const rating = {
    id: uuid(),
    shipmentId,
    raterId: req.user.id,
    ratedUserId,
    stars,
    comment: comment || '',
    createdAt: Date.now()
  };
  store.insert('ratings', rating);

  const io = req.app.get('io');
  notify(io, ratedUserId, {
    type: 'new_rating',
    message: `You received a ${stars}-star rating for your ${shipment.crop} order.`,
    data: { shipmentId }
  });

  res.status(201).json({ rating });
});

// So the frontend can decide whether to show "rate this order" for a given
// shipment, from the current user's point of view.
router.get('/mine/pending', requireAuth, (req, res) => {
  const shipments = store.filter(
    'shipments',
    (s) => s.payment.status === 'released' && (s.buyerId === req.user.id || s.farmerId === req.user.id)
  );
  const rated = new Set(
    store.filter('ratings', (r) => r.raterId === req.user.id).map((r) => r.shipmentId)
  );
  const pending = shipments.filter((s) => !rated.has(s.id));
  res.json({ pending });
});

module.exports = router;
