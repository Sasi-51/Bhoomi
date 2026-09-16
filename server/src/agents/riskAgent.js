// Risk agent - lightweight fraud/anomaly detection over the bid stream.
// Two real, explainable heuristics rather than a black-box "AI fraud score":
//  1. Rapid-fire bidding from one buyer on the same listing (wash-bidding /
//     price-manipulation pattern - a buyer bidding against themselves to
//     push the clearing price around).
//  2. Buyer concentration - one buyer placing the large majority of bids on
//     a listing, which undermines the "many buyers compete" premise the
//     pricing agent's floor-price protection depends on.
// Both are computed fresh from the existing bid history - no separate
// tracking system required, and both are cheap enough to run per-request.

const RAPID_WINDOW_MS = 60 * 1000; // bids from the same buyer within this window
const RAPID_COUNT_THRESHOLD = 3;
const CONCENTRATION_THRESHOLD = 0.8; // one buyer holding >80% of bids on a listing

function assessListingRisk(bids) {
  const flags = [];
  if (bids.length === 0) return { flags, riskLevel: 'none' };

  // 1. Rapid-fire bidding from a single buyer
  const byBuyer = {};
  for (const bid of bids) {
    (byBuyer[bid.buyerId] ||= []).push(bid);
  }
  for (const [buyerId, buyerBids] of Object.entries(byBuyer)) {
    const sorted = [...buyerBids].sort((a, b) => a.createdAt - b.createdAt);
    for (let i = 0; i + RAPID_COUNT_THRESHOLD - 1 < sorted.length; i++) {
      const windowStart = sorted[i].createdAt;
      const windowEnd = sorted[i + RAPID_COUNT_THRESHOLD - 1].createdAt;
      if (windowEnd - windowStart <= RAPID_WINDOW_MS) {
        flags.push({
          type: 'rapid_bidding',
          buyerId,
          message: `Buyer placed ${RAPID_COUNT_THRESHOLD}+ bids within ${RAPID_WINDOW_MS / 1000}s - possible price manipulation.`
        });
        break;
      }
    }
  }

  // 2. Single-buyer concentration
  const total = bids.length;
  for (const [buyerId, buyerBids] of Object.entries(byBuyer)) {
    const share = buyerBids.length / total;
    if (total >= 4 && share >= CONCENTRATION_THRESHOLD) {
      flags.push({
        type: 'buyer_concentration',
        buyerId,
        message: `One buyer placed ${(share * 100).toFixed(0)}% of all bids on this listing - limited real price competition.`
      });
    }
  }

  const riskLevel = flags.length === 0 ? 'none' : flags.length === 1 ? 'low' : 'elevated';
  return { flags, riskLevel };
}

module.exports = { assessListingRisk };
