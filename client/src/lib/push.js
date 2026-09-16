import api from './api';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('Service worker registration failed:', err.message);
    return null;
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Call after login: asks permission and subscribes this browser to push.
// No-ops quietly if the browser doesn't support push, permission is denied,
// or the server hasn't configured VAPID keys yet - none of that should ever
// block the rest of the app.
export async function enablePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const { data } = await api.get('/push/vapid-public-key');
    if (!data.configured || !data.publicKey) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey)
      });
    }

    await api.post('/push/subscribe', { subscription });
    return true;
  } catch (err) {
    console.warn('Push subscription skipped:', err.message);
    return false;
  }
}
