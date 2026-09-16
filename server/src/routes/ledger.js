const express = require('express');
const { getChain, verifyChain } = require('../agents/trustAgent');

const router = express.Router();

router.get('/', (req, res) => res.json({ chain: getChain() }));
router.get('/verify', (req, res) => res.json(verifyChain()));

module.exports = router;
