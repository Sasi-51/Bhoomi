import { useEffect, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';

export default function LedgerView() {
  const [chain, setChain] = useState([]);
  const [valid, setValid] = useState(null);

  const load = () => {
    api.get('/ledger').then((res) => setChain(res.data.chain));
    api.get('/ledger/verify').then((res) => setValid(res.data.valid));
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const onNew = () => load();
    socket.on('ledger:new', onNew);
    return () => socket.off('ledger:new', onNew);
  }, []);

  const txBlocks = chain.filter((b) => b.data?.type === 'transaction');

  return (
    <div className="bg-card border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-forest">Blockchain trust ledger</div>
        {valid !== null && (
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${valid ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#FAECE7] text-[#993C1D]'}`}>
            {valid ? 'Chain verified' : 'Integrity error'}
          </span>
        )}
      </div>

      {txBlocks.length === 0 ? (
        <p className="text-sm text-ink-soft">No settled transactions yet — accepted bids will appear here as hash-chained blocks.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {[...txBlocks].reverse().map((block) => (
            <div key={block.id} className="border border-line rounded-lg p-3 text-xs">
              <div className="flex justify-between font-mono text-ink-soft">
                <span>Block #{block.index}</span>
                <span>{new Date(block.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="mt-1 font-medium text-ink">
                {block.data.crop} · {block.data.quantityKg}kg · ₹{block.data.pricePerKg}/kg
              </div>
              <div className="mt-1 font-mono text-[10px] text-ink-soft truncate">hash {block.hash}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
