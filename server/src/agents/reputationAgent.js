// Reputation extension of the trust agent. Grading and escrow establish
// trust for a single transaction; this establishes trust across a user's
// whole history - the same signal a marketplace star rating gives, computed
// directly from settled transactions rather than self-reported claims.

function summarizeRatings(ratings) {
  if (ratings.length === 0) return { average: null, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of ratings) {
    breakdown[r.stars] = (breakdown[r.stars] || 0) + 1;
    total += r.stars;
  }
  return {
    average: Number((total / ratings.length).toFixed(2)),
    count: ratings.length,
    breakdown
  };
}

module.exports = { summarizeRatings };
