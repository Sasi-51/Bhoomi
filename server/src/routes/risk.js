const express = require('express');
const { store } = require('../db');
const { assessListingRisk } = require('../agents/riskAgent');

const router = express.Router();

router.get('/listing/:listingId', (req, res) => {
  const bids = store.filter('bids', (b) => b.listingId === req.params.listingId);
  res.json(assessListingRisk(bids));
});

module.exports = router;
