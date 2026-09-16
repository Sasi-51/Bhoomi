const AGENTS = [
  { name: 'Forecast agent', desc: 'Mandi trend + demand index', dotClass: 'bg-marigold-dark' },
  { name: 'Pricing agent', desc: 'Reverse auction, floor protection', dotClass: 'bg-indigo-2' },
  { name: 'Logistics agent', desc: 'Route consolidation (haversine + NN)', dotClass: 'bg-[#C96A4B]' },
  { name: 'Trust agent', desc: 'Hash-chained ledger + grading', dotClass: 'bg-[#4F8F6A]' },
  { name: 'Risk agent', desc: 'Wash-bidding + buyer concentration checks', dotClass: 'bg-[#993C1D]' }
];

export default function AgentPanel() {
  return (
    <div className="bg-card border border-line rounded-2xl p-5">
      <div className="text-sm font-semibold text-forest mb-4">Agent status</div>
      <div className="space-y-1">
        {AGENTS.map((a) => (
          <div key={a.name} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
            <div>
              <div className="text-[13.5px] font-semibold text-ink">{a.name}</div>
              <div className="text-xs text-ink-soft">{a.desc}</div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F6E56]">
              <span className={`w-1.5 h-1.5 rounded-full ${a.dotClass} animate-pulse`} />
              Live
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
