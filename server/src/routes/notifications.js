const express = require('express');
const { store } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const notifications = store
    .filter('notifications', (n) => n.userId === req.user.id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50);
  res.json({ notifications, unread: notifications.filter((n) => !n.read).length });
});

router.post('/:id/read', requireAuth, (req, res) => {
  const notification = store.find('notifications', (n) => n.id === req.params.id);
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  const updated = store.update('notifications', notification.id, { read: true });
  res.json({ notification: updated });
});

router.post('/read-all', requireAuth, (req, res) => {
  const mine = store.filter('notifications', (n) => n.userId === req.user.id && !n.read);
  mine.forEach((n) => store.update('notifications', n.id, { read: true }));
  res.json({ updated: mine.length });
});

module.exports = router;
