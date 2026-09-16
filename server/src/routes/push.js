const express = require('express');
const { v4: uuid } = require('uuid');
const { store } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { isConfigured } = require('../utils/push');

const router = express.Router();

// Frontend needs the public key to call the browser's PushManager.subscribe().
router.get('/vapid-public-key', (req, res) => {
  res.json({
    configured: isConfigured(),
    publicKey: process.env.VAPID_PUBLIC_KEY || null
  });
});

router.post('/subscribe', requireAuth, (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'A valid PushSubscription object is required' });
  }

  const existing = store.find(
    'pushSubscriptions',
    (s) => s.userId === req.user.id && s.subscription.endpoint === subscription.endpoint
  );
  if (existing) return res.json({ subscription: existing, alreadySubscribed: true });

  const record = { id: uuid(), userId: req.user.id, subscription, createdAt: Date.now() };
  store.insert('pushSubscriptions', record);
  res.status(201).json({ subscription: record });
});

router.post('/unsubscribe', requireAuth, (req, res) => {
  const { endpoint } = req.body;
  store.data.pushSubscriptions = store.data.pushSubscriptions.filter(
    (s) => !(s.userId === req.user.id && s.subscription.endpoint === endpoint)
  );
  store.persist();
  res.json({ ok: true });
});

module.exports = router;
