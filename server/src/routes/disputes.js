// Dispute resolution. This is deliberately scoped to what two parties can
// resolve directly: a buyer raises an issue instead of releasing escrow, and
// the farmer either refunds or contests. A contested dispute moves to
// 'escalated' rather than being silently resolved - a real deployment would
// route that to a human arbitrator/admin panel, which this project doesn't
// build (see README). The state machine and audit trail are real; the
// arbitration authority behind "contest" is not.

const express = require('express');
const { v4: uuid } = require('uuid');
const { store } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { notify } = require('../utils/notify');

const router = express.Router();

router.get('/mine', requireAuth, (req, res) => {
  const disputes = store
    .filter('disputes', (d) => d.buyerId === req.user.id || d.farmerId === req.user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json({ disputes });
});

router.post('/', requireAuth, (req, res) => {
  const { shipmentId, reason } = req.body;
  if (!shipmentId || !reason) return res.status(400).json({ error: 'shipmentId and reason are required' });

  const shipment = store.find('shipments', (s) => s.id === shipmentId);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  if (shipment.buyerId !== req.user.id) return res.status(403).json({ error: 'Only the buyer on this order can raise a dispute' });
  if (shipment.payment.status !== 'escrowed') {
    return res.status(400).json({ error: 'Disputes can only be raised while payment is still in escrow' });
  }
  const existing = store.find('disputes', (d) => d.shipmentId === shipmentId && d.status !== 'resolved');
  if (existing) return res.status(409).json({ error: 'A dispute is already open on this order' });

  const dispute = {
    id: uuid(),
    shipmentId,
    buyerId: shipment.buyerId,
    farmerId: shipment.farmerId,
    crop: shipment.crop,
    reason,
    status: 'open',
    resolution: null,
    resolutionNote: null,
    createdAt: Date.now(),
    resolvedAt: null
  };
  store.insert('disputes', dispute);
  store.update('shipments', shipment.id, { status: 'disputed' });

  const io = req.app.get('io');
  notify(io, shipment.farmerId, {
    type: 'dispute_raised',
    message: `A dispute was raised on your ${shipment.crop} order: "${reason}"`,
    data: { shipmentId, disputeId: dispute.id }
  });
  if (io) io.emit('dispute:new', dispute);

  res.status(201).json({ dispute });
});

router.post('/:id/respond', requireAuth, (req, res) => {
  const { action, note } = req.body;
  if (!['refund', 'contest'].includes(action)) {
    return res.status(400).json({ error: 'action must be "refund" or "contest"' });
  }

  const dispute = store.find('disputes', (d) => d.id === req.params.id);
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
  if (dispute.farmerId !== req.user.id) return res.status(403).json({ error: 'Only the farmer on this order can respond' });
  if (dispute.status !== 'open') return res.status(400).json({ error: 'This dispute has already been responded to' });

  const shipment = store.find('shipments', (s) => s.id === dispute.shipmentId);
  const io = req.app.get('io');

  if (action === 'refund') {
    store.update('shipments', shipment.id, {
      status: 'refunded',
      payment: { ...shipment.payment, status: 'refunded', releasedAt: Date.now() }
    });
    const updated = store.update('disputes', dispute.id, {
      status: 'resolved',
      resolution: 'refund',
      resolutionNote: note || '',
      resolvedAt: Date.now()
    });
    notify(io, dispute.buyerId, {
      type: 'dispute_resolved',
      message: `The farmer refunded your ${dispute.crop} order in full.`,
      data: { shipmentId: shipment.id }
    });
    if (io) io.emit('dispute:resolved', updated);
    return res.json({ dispute: updated });
  }

  // contest - stays open for manual review; no automated arbiter here
  const updated = store.update('disputes', dispute.id, {
    status: 'escalated',
    resolutionNote: note || ''
  });
  notify(io, dispute.buyerId, {
    type: 'dispute_escalated',
    message: `The farmer contested your dispute on ${dispute.crop}. This needs manual review.`,
    data: { shipmentId: shipment.id }
  });
  if (io) io.emit('dispute:resolved', updated);
  res.json({ dispute: updated });
});

module.exports = router;
