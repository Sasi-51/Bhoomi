import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ForecastChart from '../components/ForecastChart';
import AgentPanel from '../components/AgentPanel';
import LedgerView from '../components/LedgerView';
import OrdersPanel from '../components/OrdersPanel';
import FpoBulkImport from '../components/FpoBulkImport';
import DemandBoard from '../components/DemandBoard';

const CROPS = ['Tomato', 'Onion', 'Wheat', 'Spinach', 'Potato', 'Soybean'];

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({ crop: 'Tomato', quantityKg: '', askPrice: '', sizeScore: 75, colorScore: 75, defectScore: 10 });
  const [creating, setCreating] = useState(false);

  const [forecastCrop, setForecastCrop] = useState('Tomato');
  const [question, setQuestion] = useState('');
  const [forecast, setForecast] = useState(null);
  const [history, setHistory] = useState([]);
  const [asking, setAsking] = useState(false);

  const loadListings = () => {
    api.get('/listings').then((res) => setListings(res.data.listings.filter((l) => l.farmerId === user.id)));
  };

  const loadForecast = (crop) => {
    api.get(`/forecast/${crop}`).then((res) => {
      setForecast(res.data.forecast);
      setHistory(res.data.history);
    });
  };

  useEffect(loadListings, [user.id]);
  useEffect(() => loadForecast(forecastCrop), [forecastCrop]);

  const createListing = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/listings', form);
      setForm((f) => ({ ...f, quantityKg: '', askPrice: '' }));
      loadListings();
    } finally {
      setCreating(false);
    }
  };

  const askAgent = async (e) => {
    e.preventDefault();
    setAsking(true);
    try {
      const res = await api.post('/forecast/query', { crop: forecastCrop, question });
      setForecast(res.data);
    } finally {
      setAsking(false);
    }
  };

  const fulfilDemand = (demand) => {
    setForm((f) => ({ ...f, crop: demand.crop, quantityKg: String(demand.quantityKg), askPrice: String(demand.maxPricePerKg) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-forest">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-ink-soft mt-1">Manage your listings and check what the forecast agent recommends.</p>
      </div>

      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-5">
        <div className="bg-card border border-line rounded-2xl p-5">
          <div className="text-sm font-semibold text-forest mb-4">Your active listings</div>
          {listings.length === 0 ? (
            <p className="text-sm text-ink-soft">No listings yet — create one below to get discovered by buyers.</p>
          ) : (
            <div className="space-y-1">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-3 border-b border-line last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-ink">{l.crop} · Grade {l.grade}</div>
                    <div className="text-xs text-ink-soft">{l.quantityKg} kg · listed {new Date(l.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-forest">₹{l.askPrice}/kg</div>
                    <div className={`text-xs font-medium ${l.status === 'sold' ? 'text-[#0F6E56]' : 'text-ink-soft'}`}>{l.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={createListing} className="mt-6 pt-5 border-t border-line grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft block mb-1">Crop</label>
              <select
                value={form.crop}
                onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}
                className="w-full border border-line rounded-lg px-3 py-2 bg-white text-sm"
              >
                {CROPS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft block mb-1">Quantity (kg)</label>
              <input required type="number" min="1" value={form.quantityKg} onChange={(e) => setForm((f) => ({ ...f, quantityKg: e.target.value }))} className="w-full border border-line rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft block mb-1">Your ask price (₹/kg)</label>
              <input required type="number" min="1" step="0.1" value={form.askPrice} onChange={(e) => setForm((f) => ({ ...f, askPrice: e.target.value }))} className="w-full border border-line rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 grid grid-cols-3 gap-3">
              {[
                ['sizeScore', 'Size'],
                ['colorScore', 'Colour'],
                ['defectScore', 'Defects']
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-ink-soft block mb-1">{label}: {form[key]}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
            <p className="sm:col-span-2 text-[11px] text-ink-soft -mt-1">
              These simulate the on-device CV quality scan that runs on a real produce photo.
            </p>
            <button disabled={creating} className="sm:col-span-2 bg-forest text-sage py-2.5 rounded-lg font-semibold hover:bg-forest-2 transition-colors disabled:opacity-60">
              {creating ? 'Listing…' : 'List this harvest'}
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <AgentPanel />
          <OrdersPanel role="farmer" />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-5">
        <div className="bg-card border border-line rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-forest">Demand forecast</div>
            <select value={forecastCrop} onChange={(e) => setForecastCrop(e.target.value)} className="text-sm border border-line rounded-lg px-2 py-1">
              {CROPS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <ForecastChart history={history} />
          {forecast && (
            <div className="mt-4 bg-forest rounded-xl p-4 text-sage">
              <div className="text-xs text-sage/70 mb-1">
                Forecast agent {forecast.source === 'llm' ? '(Claude-backed)' : '(statistical model)'}
              </div>
              <p className="text-sm leading-relaxed">{forecast.answer || forecast.message}</p>
            </div>
          )}
          <form onSubmit={askAgent} className="mt-3 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask: what should I plant next?"
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
            />
            <button disabled={asking} className="bg-marigold text-forest font-semibold px-4 rounded-lg text-sm disabled:opacity-60">
              {asking ? '…' : 'Ask'}
            </button>
          </form>
        </div>

        <LedgerView />
      </div>

      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-5">
        <FpoBulkImport onImported={loadListings} />
        <DemandBoard role="farmer" onFulfill={fulfilDemand} />
      </div>
    </div>
  );
}
