// Activity feed - an observability layer over the other agents, not a new
// source of truth. Every entry here is derived from data that already
// exists (listings, ledger blocks, shipments, disputes); nothing is
// generated or simulated specifically for this feed. This is what a
// production "agent trace" panel looks like: a readable log of automated
// decisions, not a black box.

const { store } = require('../db');

function buildFeed(limit = 40) {
  const events = [];

  for (const l of store.all('listings')) {
    events.push({
      id: `listing-${l.id}`,
      timestamp: l.createdAt,
      agent: 'grading',
      message: `Grading agent scored a new ${l.crop} listing — Grade ${l.grade} (${l.gradeScore}/100)`
    });
  }

  for (const block of store.all('ledger')) {
    if (block.data?.type === 'transaction') {
      events.push({
        id: `ledger-${block.id}`,
        timestamp: block.timestamp,
        agent: 'pricing',
        message: `Pricing agent cleared a bid on ${block.data.crop} at ₹${block.data.pricePerKg}/kg — ₹${block.data.amount} moved to escrow`
      });
    } else if (block.data?.type === 'settlement') {
      events.push({
        id: `ledger-${block.id}`,
        timestamp: block.timestamp,
        agent: 'trust',
        message: `Trust agent released ₹${block.data.amount} for ${block.data.crop} on delivery confirmation`
      });
    }
  }

  for (const s of store.all('shipments')) {
    events.push({
      id: `ship-${s.id}`,
      timestamp: s.createdAt,
      agent: 'logistics',
      message: `Logistics agent routed a ${s.crop} shipment — ${s.savingsPct}% distance saved vs. an unoptimised run`
    });
  }

  for (const d of store.all('disputes')) {
    events.push({
      id: `dispute-${d.id}`,
      timestamp: d.createdAt,
      agent: 'risk',
      message: `Dispute raised on a ${d.crop} order — routed for farmer response`
    });
    if (d.resolvedAt) {
      events.push({
        id: `dispute-resolved-${d.id}`,
        timestamp: d.resolvedAt,
        agent: 'risk',
        message:
          d.resolution === 'refund'
            ? `Dispute on ${d.crop} resolved — full refund issued`
            : `Dispute on ${d.crop} escalated for manual review`
      });
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

module.exports = { buildFeed };
