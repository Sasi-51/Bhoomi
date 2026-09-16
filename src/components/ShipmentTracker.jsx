import { useEffect, useState, lazy, Suspense } from 'react';

const Scene3DTracking = lazy(() => import('./Scene3DTracking'));

function computeProgress(shipment) {
  if (!shipment.estimatedTransitMinutes) return 0;
  const elapsedMs = Date.now() - shipment.createdAt;
  const totalMs = shipment.estimatedTransitMinutes * 60 * 1000;
  return Math.min(1, Math.max(0, elapsedMs / totalMs));
}

export default function ShipmentTracker({ shipment }) {
  const [progress, setProgress] = useState(() => computeProgress(shipment));

  useEffect(() => {
    const id = setInterval(() => setProgress(computeProgress(shipment)), 3000);
    return () => clearInterval(id);
  }, [shipment]);

  const remainingMin = Math.max(0, Math.round(shipment.estimatedTransitMinutes * (1 - progress)));

  return (
    <div className="mt-3 pt-3 border-t border-line">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-ink-soft">Live tracking · {shipment.distanceKm} km route</span>
        <span className="text-[11px] font-mono text-marigold-dark">
          {progress >= 1 ? 'Arriving' : `ETA ~${remainingMin} min`}
        </span>
      </div>
      <div className="h-52 rounded-xl overflow-hidden border border-line bg-sage-2">
        <Scene3DTrackingLazy route={shipment.route} progress={progress} />
      </div>
      <div className="w-full h-1.5 rounded-full bg-line overflow-hidden mt-2">
        <div className="h-full bg-marigold-dark rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

// Small wrapper so the (heavier) three.js scene only ever mounts when a
// tracker is actually visible, not preloaded for every order card.
function Scene3DTrackingLazy(props) {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-xs text-ink-soft">Loading map…</div>}>
      <Scene3DTracking {...props} />
    </Suspense>
  );
}
