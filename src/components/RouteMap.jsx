import { useEffect, useState } from 'react';
import api from '../lib/api';

function project(points, width, height, padding) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;

  return points.map((p) => ({
    ...p,
    x: padding + ((p.lng - minLng) / spanLng) * (width - padding * 2),
    // invert y since latitude increases upward but SVG y increases downward
    y: height - padding - ((p.lat - minLat) / spanLat) * (height - padding * 2)
  }));
}

export default function RouteMap() {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    api.get('/logistics/demo').then((res) => setRoute(res.data)).catch(() => {});
  }, []);

  if (!route) return <div className="text-sm text-ink-soft">Loading route…</div>;

  const width = 640;
  const height = 220;
  const projected = project(route.route, width, height, 32);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {projected.slice(0, -1).map((p, i) => (
          <line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={projected[i + 1].x}
            y2={projected[i + 1].y}
            stroke="#3D5E71"
            strokeWidth={2}
          />
        ))}
        {projected.map((p, i) => {
          const isHub = i === 0;
          const isDest = i === projected.length - 1;
          const color = isHub ? '#0F6E56' : isDest ? '#185FA5' : '#8A5E17';
          return (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r={isHub || isDest ? 8 : 6} fill={color} />
              <text x={p.x} y={p.y + (isHub ? -14 : 18)} textAnchor="middle" fontSize="11" fill="#4A5750">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-ink-soft">
        <span><span className="inline-block w-2 h-2 rounded-full bg-[#0F6E56] mr-1.5" />Hub</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-marigold-dark mr-1.5" />Pickup</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-[#185FA5] mr-1.5" />Buyer</span>
        <span className="font-medium text-forest">{route.savingsPct}% distance saved vs. unoptimised route</span>
      </div>
    </div>
  );
}
