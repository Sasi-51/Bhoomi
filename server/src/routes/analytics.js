const express = require('express');
const { computeOverview } = require('../agents/analyticsAgent');

const router = express.Router();

router.get('/overview', (req, res) => res.json(computeOverview()));

module.exports = router;
