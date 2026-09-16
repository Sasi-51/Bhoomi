// Pricing agent - runs the reverse auction for each listing.
// Floor price is derived from live mandi data so a buyer can never clear a bid
// below what the farmer would get at the local market - this is the concrete
// mechanism behind "better prices for farmers" rather than a marketing claim.

const FLOOR_MARKUP = 1.08; // farmer must get at least 8% above raw mandi rate

function floorPriceFor(mandiSeries) {
  const last = mandiSeries[mandiSeries.length - 1].price;
  return Number((last * FLOOR_MARKUP).toFixed(2));
}

function evaluateBid({ listing, bidPricePerKg, mandiSeries, existingBids }) {
  const floor = floorPriceFor(mandiSeries);
  const highestExisting = existingBids.reduce((max, b) => Math.max(max, b.pricePerKg), 0);

  if (bidPricePerKg < floor) {
    return {
      accepted: false,
      floor,
      reason: `Bid ₹${bidPricePerKg}/kg is below the protected floor price of ₹${floor}/kg for this crop.`
    };
  }

  if (bidPricePerKg <= highestExisting) {
    return {
      accepted: false,
      floor,
      reason: `Bid must exceed the current leading bid of ₹${highestExisting}/kg.`
    };
  }

  // Clears if it meets/exceeds the farmer's ask, or is the new best bid above floor.
  const clears = bidPricePerKg >= listing.askPrice || bidPricePerKg > highestExisting;

  return {
    accepted: clears,
    floor,
    clearingPrice: bidPricePerKg,
    reason: clears
      ? `Bid accepted at ₹${bidPricePerKg}/kg.`
      : `Bid recorded but below the farmer's ask of ₹${listing.askPrice}/kg; waiting for a higher bid or farmer approval.`
  };
}

module.exports = { evaluateBid, floorPriceFor };
