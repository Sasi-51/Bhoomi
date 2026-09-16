// Live platform analytics - every number here is computed fresh from the
// actual stored data (listings, bids, shipments, ledger), not hardcoded
// marketing figures. This is what powers the "live stats" strip on the
// landing page.

const { store } = require('../db');

function computeOverview() {
  const listings = store.all('listings');
  const shipments = store.all('shipments');
  const ledger = store.all('ledger').filter((b) => b.data?.type === 'transaction' || b.data?.type === 'settlement');
  const users = store.all('users');

  const settledShipments = shipments.filter((s) => s.payment.status === 'released');
  const grossValueSettled = settledShipments.reduce((sum, s) => sum + s.payment.amount, 0);
  const escrowHeld = shipments
    .filter((s) => s.payment.status === 'escrowed')
    .reduce((sum, s) => sum + s.payment.amount, 0);

  const avgSavingsPct = shipments.length
    ? shipments.reduce((sum, s) => sum + (s.savingsPct || 0), 0) / shipments.length
    : 0;

  const avgFreshness = shipments.length
    ? shipments.reduce((sum, s) => sum + (s.freshnessScore ?? 100), 0) / shipments.length
    : 100;

  return {
    farmers: users.filter((u) => u.role === 'farmer').length,
    buyers: users.filter((u) => u.role === 'buyer').length,
    activeListings: listings.filter((l) => l.status === 'active').length,
    totalListings: listings.length,
    ordersSettled: settledShipments.length,
    ordersInEscrow: shipments.filter((s) => s.payment.status === 'escrowed').length,
    grossValueSettled: Number(grossValueSettled.toFixed(2)),
    valueInEscrow: Number(escrowHeld.toFixed(2)),
    avgRouteSavingsPct: Number(avgSavingsPct.toFixed(1)),
    avgFreshnessScore: Number(avgFreshness.toFixed(1)),
    ledgerBlocks: ledger.length,
    generatedAt: Date.now()
  };
}

module.exports = { computeOverview };
