const express = require('express');
const { buildFeed } = require('../agents/activityFeedAgent');

const router = express.Router();

router.get('/feed', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 40, 100);
  res.json({ events: buildFeed(limit) });
});

module.exports = router;
