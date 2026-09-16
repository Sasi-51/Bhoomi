import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

export default function Ticker() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const socket = getSocket();
    const onSnapshot = (history) => {
      const latest = {};
      Object.entries(history).forEach(([crop, series]) => {
        latest[crop] = series[series.length - 1].price;
      });
      setPrices(latest);
    };
    const onUpdate = (updates) => setPrices((prev) => ({ ...prev, ...updates }));

    socket.on('ticker:snapshot', onSnapshot);
    socket.on('ticker:update', onUpdate);
    return () => {
      socket.off('ticker:snapshot', onSnapshot);
      socket.off('ticker:update', onUpdate);
    };
  }, []);

  const entries = Object.entries(prices);
  const items = entries.length ? [...entries, ...entries] : [];

  return (
    <div className="bg-forest overflow-hidden whitespace-nowrap py-2">
      <div className="inline-block animate-ticker">
        {items.length === 0 && (
          <span className="font-mono text-xs text-sage/70 px-4">Connecting to live mandi feed…</span>
        )}
        {items.map(([crop, price], i) => (
          <span key={`${crop}-${i}`} className="inline-flex items-center gap-2 font-mono text-[13px] text-sage/90 mr-12">
            <span className="text-marigold font-medium">{crop}</span>
            ₹{price.toFixed(2)}/kg
          </span>
        ))}
      </div>
    </div>
  );
}
