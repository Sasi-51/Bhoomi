// Native browser push notifications (the Web Push API), not to be confused
// with the in-app Socket.IO notifications in notify.js. This is what lets a
// notification reach a farmer/buyer's phone even if BHOOMI isn't open in a
// tab - the same mechanism real product notifications use.
//
// Requires a VAPID key pair. Generate one with:
//   npx web-push generate-vapid-keys
// and put the values in server/.env as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.
// If those aren't set, push sending is silently skipped - the rest of the
// app (including in-app notifications) works exactly the same either way.

const { store } = require('../db');

let webpush = null;
let configured = false;

function getWebPush() {
  if (webpush) return webpush;
  try {
    webpush = require('web-push');
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT_EMAIL } = process.env;
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        `mailto:${VAPID_CONTACT_EMAIL || 'admin@example.com'}`,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );
      configured = true;
    }
    return webpush;
  } catch (err) {
    // web-push not installed yet (npm install hasn't run) - fail soft
    return null;
  }
}

function isConfigured() {
  getWebPush();
  return configured;
}

async function sendPushToUser(userId, { title, body, url }) {
  const wp = getWebPush();
  if (!wp || !configured) return;

  const subs = store.filter('pushSubscriptions', (s) => s.userId === userId);
  const payload = JSON.stringify({ title, body, url: url || '/' });

  for (const sub of subs) {
    try {
      await wp.sendNotification(sub.subscription, payload);
    } catch (err) {
      // Subscription expired or the browser revoked it - remove it so we
      // stop wasting calls on a dead endpoint.
      if (err.statusCode === 404 || err.statusCode === 410) {
        store.data.pushSubscriptions = store.data.pushSubscriptions.filter((s) => s.id !== sub.id);
        store.persist();
      } else {
        console.error('[push] send failed:', err.message);
      }
    }
  }
}

module.exports = { sendPushToUser, isConfigured, getWebPush };
