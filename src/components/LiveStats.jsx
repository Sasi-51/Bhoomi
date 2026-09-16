import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function LiveStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = () => api.get('/analytics/overview').then((res) => setStats(res.data)).catch(() => {});
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const items = [
    { label: 'Active listings', value: stats.activeListings },
    { label: 'Orders settled', value: stats.ordersSettled },
    { label: 'Value in escrow', value: `₹${stats.valueInEscrow.toLocaleString('en-IN')}` },
    { label: 'Avg. route savings', value: `${stats.avgRouteSavingsPct}%` },
    { label: 'Ledger blocks', value: stats.ledgerBlocks }
  ];

  return (
    <div className="border-y border-line bg-card">
      <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="font-display text-xl font-semibold text-forest">{item.value}</div>
            <div className="text-[11px] text-ink-soft mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
