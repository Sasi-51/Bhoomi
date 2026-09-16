// Cold-chain agent - turns raw sensor readings into a single freshness score.
// A real deployment reads this from a LoRaWAN temperature/humidity tag on the
// crate; this module simulates that stream so the dashboard has live data to
// show, and the scoring function is the real logic that would run either way.

const SAFE_TEMP_MAX = 8; // deg C, upper bound for most fresh produce in transit

function simulateReading(prevTemp) {
  const base = prevTemp ?? 5 + Math.random() * 2;
  // random walk with an occasional excursion to make the dashboard feel alive
  const excursion = Math.random() < 0.08 ? Math.random() * 4 : 0;
  const temp = Number((base + (Math.random() - 0.5) * 1.2 + excursion).toFixed(1));
  const humidity = Number((85 + (Math.random() - 0.5) * 10).toFixed(1));
  return { t: Date.now(), temp, humidity };
}

function scoreFreshness(tempLogs) {
  if (!tempLogs.length) return 100;
  let score = 100;
  for (const log of tempLogs) {
    if (log.temp > SAFE_TEMP_MAX) {
      score -= (log.temp - SAFE_TEMP_MAX) * 1.5;
    }
    score -= 0.15; // gentle decay per elapsed reading regardless of temperature
  }
  return Number(Math.max(0, Math.min(100, score)).toFixed(1));
}

module.exports = { simulateReading, scoreFreshness, SAFE_TEMP_MAX };
