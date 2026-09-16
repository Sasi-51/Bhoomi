// Pushes a notification to one user over two independent channels:
//  1. In-app, via Socket.IO to a private room (instant, only while online)
//  2. Native browser push, via Web Push (works even if BHOOMI isn't open)
// Also persisted so GET /api/notifications shows history after a reload.

const { v4: uuid } = require('uuid');
const { store } = require('../db');
const { sendPushToUser } = require('./push');

function notify(io, userId, { type, message, data = {} }) {
  const notification = {
    id: uuid(),
    userId,
    type,
    message,
    data,
    read: false,
    createdAt: Date.now()
  };
  store.insert('notifications', notification);
  if (io) io.to(`user:${userId}`).emit('notification:new', notification);

  // Best-effort - if VAPID keys aren't configured or web-push isn't
  // installed yet, sendPushToUser silently no-ops.
  sendPushToUser(userId, { title: 'BHOOMI', body: message }).catch(() => {});

  return notification;
}

module.exports = { notify };

