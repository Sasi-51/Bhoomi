// Real-time layer. Two independent simulated feeds:
//  1. mandi ticker - a gentle random walk over each crop's last known price,
//     broadcast every few seconds (swap for a real market data feed in prod).
//  2. cold-chain readings - one simulated sensor tick per in-transit shipment.
// Both push through the same io instance the REST routes use for bid/ledger
// events, so the whole app shares one live event bus.

const jwt = require('jsonwebtoken');
const { store } = require('../db');
const { simulateReading, scoreFreshness } = require('../agents/coldChainAgent');

function startTicker(io) {
  setInterval(() => {
    const history = store.data.mandiHistory;
    const updates = {};
    for (const crop of Object.keys(history)) {
      const series = history[crop];
      const last = series[series.length - 1].price;
      const next = Math.max(3, Number((last + (Math.random() - 0.5) * 0.6).toFixed(2)));
      series.push({ t: Date.now(), price: next });
      if (series.length > 60) series.shift();
      updates[crop] = next;
    }
    store.persist();
    io.emit('ticker:update', updates);
  }, 4000);
}

function startColdChainSimulation(io) {
  setInterval(() => {
    const shipments = store.filter('shipments', (s) => s.status === 'in_transit');
    for (const shipment of shipments) {
      const prevTemp = shipment.tempLogs.length ? shipment.tempLogs[shipment.tempLogs.length - 1].temp : undefined;
      const reading = simulateReading(prevTemp);
      const tempLogs = [...shipment.tempLogs, reading].slice(-40);
      const freshnessScore = scoreFreshness(tempLogs);
      store.update('shipments', shipment.id, { tempLogs, freshnessScore });
      io.emit('iot:reading', { shipmentId: shipment.id, reading, freshnessScore });
    }
  }, 6000);
}

function attachSockets(io) {
  io.on('connection', (socket) => {
    socket.emit('ticker:snapshot', store.data.mandiHistory);
    socket.emit('shipments:snapshot', store.all('shipments'));

    // Client sends its JWT right after connecting so we can join a private
    // room for this user - notify() then targets `user:<id>` directly instead
    // of broadcasting every notification to every connected browser.
    socket.on('auth', (token) => {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.join(`user:${payload.id}`);
      } catch (err) {
        // invalid/expired token - just skip the room join, no need to error
      }
    });
  });

  startTicker(io);
  startColdChainSimulation(io);
}

module.exports = { attachSockets };
