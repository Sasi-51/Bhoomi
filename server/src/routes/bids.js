const express = require('express');
const { v4: uuid } = require('uuid');
const { store } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { evaluateBid } = require('../agents/pricingAgent');
const { optimizeRoute } = require('../agents/logisticsAgent');
const { appendBlock } = require('../agents/trustAgent');
const { notify } = require('../utils/notify');

const router = express.Router();

const HUB = { lat: 19.9975, lng: 73.7898, label: 'Nashik consolidation hub' };

router.get('/listing/:listingId', (req, res) => {
  const bids = store.filter('bids', (b) => b.listingId === req.params.listingId);
  res.json({ bids: bids.sort((a, b) => b.pricePerKg - a.pricePerKg) });
});

router.get('/mine', requireAuth, (req, res) => {
  const bids = store.filter('bids', (b) => b.buyerId === req.user.id);
  res.json({ bids });
});

router.post('/', requireAuth, requireRole('buyer'), (req, res) => {
  const { listingId, pricePerKg } = req.body;
  const listing = store.find('listings', (l) => l.id === listingId);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== 'active') return res.status(400).json({ error: 'Listing is no longer active' });
  if (!pricePerKg || pricePerKg <= 0) return res.status(400).json({ error: 'pricePerKg must be a positive number' });

  const mandiSeries = store.data.mandiHistory[listing.crop];
  const existingBids = store.filter('bids', (b) => b.listingId === listingId && b.status !== 'rejected');

  const result = evaluateBid({ listing, bidPricePerKg: Number(pricePerKg), mandiSeries, existingBids });

  const bid = {
    id: uuid(),
    listingId,
    buyerId: req.user.id,
    pricePerKg: Number(pricePerKg),
    status: result.accepted ? 'accepted' : 'pending',
    floorPrice: result.floor,
    reason: result.reason,
    createdAt: Date.now()
  };
  store.insert('bids', bid);

  const io = req.app.get('io');

  if (result.accepted) {
    store.update('listings', listing.id, { status: 'sold' });

    const buyer = store.find('users', (u) => u.id === req.user.id);
    const farmer = store.find('users', (u) => u.id === listing.farmerId);

    const farmStop = { ...(farmer?.location || HUB), label: farmer?.name || 'Farm' };
    const buyerLoc = { ...(buyer?.location || HUB), label: buyer?.name || 'Buyer' };

    const routeResult = optimizeRoute({ hub: HUB, stops: [farmStop], destination: buyerLoc });

    const amount = Number((listing.quantityKg * bid.pricePerKg).toFixed(2));

    const shipment = {
      id: uuid(),
      listingId: listing.id,
      bidId: bid.id,
      farmerId: listing.farmerId,
      buyerId: bid.buyerId,
      crop: listing.crop,
      quantityKg: listing.quantityKg,
      pricePerKg: bid.pricePerKg,
      route: routeResult.route,
      distanceKm: routeResult.optimizedDistanceKm,
      savingsPct: routeResult.savingsPct,
      // Assumes ~40 km/h average for a mixed rural/highway milk-run - real
      // enough to drive a genuine progress bar, not a fixed fake duration.
      estimatedTransitMinutes: Math.max(20, Math.round((routeResult.optimizedDistanceKm / 40) * 60)),
      status: 'in_transit',
      tempLogs: [],
      freshnessScore: 100,
      payment: {
        status: 'escrowed',
        amount,
        method: 'upi',
        vpa: 'bhoomi.escrow@upi',
        escrowedAt: Date.now(),
        releasedAt: null
      },
      createdAt: Date.now()
    };
    store.insert('shipments', shipment);

    const block = appendBlock({
      type: 'transaction',
      listingId: listing.id,
      bidId: bid.id,
      shipmentId: shipment.id,
      crop: listing.crop,
      quantityKg: listing.quantityKg,
      pricePerKg: bid.pricePerKg,
      amount,
      farmerId: listing.farmerId,
      buyerId: bid.buyerId
    });

    notify(io, listing.farmerId, {
      type: 'bid_accepted',
      message: `${listing.crop} sold at ₹${bid.pricePerKg}/kg — ₹${amount} is now held in escrow, released on delivery confirmation.`,
      data: { shipmentId: shipment.id, listingId: listing.id }
    });
    notify(io, bid.buyerId, {
      type: 'bid_accepted',
      message: `Your bid on ${listing.crop} cleared at ₹${bid.pricePerKg}/kg. Payment is held in escrow until you confirm delivery.`,
      data: { shipmentId: shipment.id, listingId: listing.id }
    });

    if (io) {
      io.emit('bid:accepted', { bid, listing, shipment });
      io.emit('ledger:new', block);
    }

    return res.status(201).json({ bid, accepted: true, shipment, ledgerBlock: block });
  }

  if (io) io.emit('bid:update', { bid, listing });
  res.status(201).json({ bid, accepted: false, reason: result.reason });
});

module.exports = router;
