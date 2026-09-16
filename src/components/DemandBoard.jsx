import { useEffect, useState } from 'react';
import api from '../lib/api';

const CROPS = ['Tomato', 'Onion', 'Wheat', 'Spinach', 'Potato', 'Soybean'];

function PostDemandForm({ onPosted }) {
  const [form, setForm] = useState({ crop: 'Tomato', quantityKg: '', maxPricePerKg: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/demands', form);
      setForm((f) => ({ ...f, quantityKg: '', maxPricePerKg: '', notes: '' }));
      onPosted();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post demand.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 mb-5 pb-5 border-b border-line">
      <select value={form.crop} onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))} className="border border-line rounded-lg px-3 py-2 text-sm bg-white">
        {CROPS.map((c) => <option key={c}>{c}</option>)}
      </select>
      <input required type="number" min="1" placeholder="Quantity needed (kg)" value={form.quantityKg} onChange={(e) => setForm((f) => ({ ...f, quantityKg: e.target.value }))} className="border border-line rounded-lg px-3 py-2 text-sm" />
      <input required type="number" min="1" step="0.1" placeholder="Max price ₹/kg" value={form.maxPricePerKg} onChange={(e) => setForm((f) => ({ ...f, maxPricePerKg: e.target.value }))} className="border border-line rounded-lg px-3 py-2 text-sm" />
      <input placeholder="Notes (e.g. weekly, needs cold-chain)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="border border-line rounded-lg px-3 py-2 text-sm" />
      <button disabled={busy} className="sm:col-span-2 bg-forest text-sage font-semibold text-sm py-2 rounded-lg disabled:opacity-60">
        {busy ? 'Posting…' : 'Post standing demand'}
      </button>
      {error && <p className="sm:col-span-2 text-xs text-[#993C1D]">{error}</p>}
    </form>
  );
}

export default function DemandBoard({ role, onFulfill }) {
  const [demands, setDemands] = useState([]);

  const load = () => api.get('/demands').then((res) => setDemands(res.data.demands));

  useEffect(() => {
    load();
  }, []);

  const close = async (id) => {
    await api.post(`/demands/${id}/close`);
    load();
  };

  return (
    <div className="bg-card border border-line rounded-2xl p-5">
      <div className="text-sm font-semibold text-forest mb-4">
        {role === 'buyer' ? 'Your standing demand' : 'Buyer demand board'}
      </div>

      {role === 'buyer' && <PostDemandForm onPosted={load} />}

      {demands.length === 0 ? (
        <p className="text-sm text-ink-soft">
          {role === 'buyer' ? "You haven't posted a standing order yet." : 'No open bulk-buyer demand right now.'}
        </p>
      ) : (
        <div className="space-y-2">
          {demands.map((d) => (
            <div key={d.id} className="flex items-center justify-between border border-line rounded-lg p-3">
              <div>
                <div className="text-sm font-semibold text-ink">{d.crop} · {d.quantityKg} kg</div>
                <div className="text-xs text-ink-soft">
                  up to ₹{d.maxPricePerKg}/kg · {d.buyerName}{d.notes ? ` · ${d.notes}` : ''}
                </div>
              </div>
              {role === 'buyer' ? (
                <button onClick={() => close(d.id)} className="text-xs font-semibold text-ink-soft border border-line px-3 py-1.5 rounded-lg">
                  Close
                </button>
              ) : (
                <button
                  onClick={() => onFulfill && onFulfill(d)}
                  className="text-xs font-semibold bg-marigold text-forest px-3 py-1.5 rounded-lg"
                >
                  Fulfil this
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
