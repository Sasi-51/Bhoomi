// Logistics agent - route consolidation for milk-run pickups.
// Uses the haversine formula for real geographic distance and a nearest-neighbour
// heuristic for the travelling-salesman-style ordering problem. This is the same
// class of algorithm production routing engines use as a fast approximate solver
// before a more expensive exact/OR-tools pass - good enough for real savings,
// cheap enough to run on every request.

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pathDistance(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineKm(points[i], points[i + 1]);
  }
  return total;
}

// Nearest-neighbour heuristic starting from `hub`, visiting every stop once,
// ending at `destination`.
function optimizeRoute({ hub, stops, destination }) {
  const remaining = [...stops];
  const ordered = [];
  let current = hub;

  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((stop, idx) => {
      const d = haversineKm(current, stop);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next;
  }

  const fullPath = [hub, ...ordered, destination];
  const optimizedDistanceKm = pathDistance(fullPath);

  // naive baseline: visit stops in the order they were given (what a human
  // dispatcher without tooling would typically do)
  const naivePath = [hub, ...stops, destination];
  const naiveDistanceKm = pathDistance(naivePath);

  const savingsPct = naiveDistanceKm > 0
    ? Math.max(0, ((naiveDistanceKm - optimizedDistanceKm) / naiveDistanceKm) * 100)
    : 0;

  return {
    route: fullPath,
    orderedStops: ordered,
    optimizedDistanceKm: Number(optimizedDistanceKm.toFixed(2)),
    naiveDistanceKm: Number(naiveDistanceKm.toFixed(2)),
    savingsPct: Number(savingsPct.toFixed(1))
  };
}

module.exports = { optimizeRoute, haversineKm };
