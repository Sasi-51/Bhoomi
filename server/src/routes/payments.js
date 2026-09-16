const express = require('express');
const { store } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { appendBlock } = require('../agents/trustAgent');
const { notify } = require('../utils/notify');

const router = express.Router();

function assertParty(shipment, userId) {
  return shipment.farmerId === userId || shipment.buyerId === userId;
}

// All shipments (i.e. orders) the current user is party to, as either the
// selling farmer or the buying party — this is the "My orders" feed for
// both dashboards.
router.get('/mine', requireAuth, (req, res) => {
  const shipments = store
    .filter('shipments', (s) => s.farmerId === req.user.id || s.buyerId === req.user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json({ shipments });
});

router.get('/:shipmentId', requireAuth, (req, res) => {
  const shipment = store.find('shipments', (s) => s.id === req.params.shipmentId);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  if (!assertParty(shipment, req.user.id)) return res.status(403).json({ error: 'Not authorized to view this shipment' });
  res.json({ shipment });
});

// Buyer confirms the produce arrived — this is the "smart contract" moment:
// escrow releases to the farmer and a settlement block is written to the
// ledger. No real money moves in this reference implementation (see README),
// but the state machine and event flow are exactly what a real payment
// gateway webhook would trigger.
router.post('/:shipmentId/release', requireAuth, (req, res) => {
  const shipment = store.find('shipments', (s) => s.id === req.params.shipmentId);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  if (shipment.buyerId !== req.user.id) return res.status(403).json({ error: 'Only the buyer on this order can confirm delivery' });
  if (shipment.payment.status === 'released') return res.status(400).json({ error: 'Payment has already been released' });

  const updated = store.update('shipments', shipment.id, {
    status: 'delivered',
    payment: { ...shipment.payment, status: 'released', releasedAt: Date.now() }
  });

  const block = appendBlock({
    type: 'settlement',
    shipmentId: shipment.id,
    crop: shipment.crop,
    quantityKg: shipment.quantityKg,
    pricePerKg: shipment.pricePerKg,
    amount: shipment.payment.amount,
    farmerId: shipment.farmerId,
    buyerId: shipment.buyerId
  });

  const io = req.app.get('io');

  notify(io, shipment.farmerId, {
    type: 'payment_released',
    message: `Delivery confirmed — ₹${shipment.payment.amount} for your ${shipment.crop} order has been released to you.`,
    data: { shipmentId: shipment.id }
  });
  notify(io, shipment.buyerId, {
    type: 'payment_released',
    message: `Delivery confirmed for ${shipment.crop}. ₹${shipment.payment.amount} released from escrow.`,
    data: { shipmentId: shipment.id }
  });

  if (io) {
    io.emit('payment:released', { shipment: updated });
    io.emit('ledger:new', block);
  }

  res.json({ shipment: updated, ledgerBlock: block });
});

module.exports = router;
