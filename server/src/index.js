require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const bidsRoutes = require('./routes/bids');
const forecastRoutes = require('./routes/forecast');
const logisticsRoutes = require('./routes/logistics');
const ledgerRoutes = require('./routes/ledger');
const iotRoutes = require('./routes/iot');
const paymentsRoutes = require('./routes/payments');
const notificationsRoutes = require('./routes/notifications');
const riskRoutes = require('./routes/risk');
const analyticsRoutes = require('./routes/analytics');
const pushRoutes = require('./routes/push');
const ratingsRoutes = require('./routes/ratings');
const fpoRoutes = require('./routes/fpo');
const demandsRoutes = require('./routes/demands');
const disputesRoutes = require('./routes/disputes');
const activityRoutes = require('./routes/activity');
const { attachSockets } = require('./sockets');

if (!process.env.JWT_SECRET) {
  console.warn('[bhoomi] WARNING: JWT_SECRET is not set. Copy .env.example to .env before running in production.');
}

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] }
});
app.set('io', io);

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'bhoomi-server', time: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/bids', bidsRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/fpo', fpoRoutes);
app.use('/api/demands', demandsRoutes);
app.use('/api/disputes', disputesRoutes);
app.use('/api/activity', activityRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

attachSockets(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`BHOOMI server listening on http://localhost:${PORT}`);
  console.log(`Accepting client requests from ${CLIENT_ORIGIN}`);
});
