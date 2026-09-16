import { useEffect, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import RouteMap from '../components/RouteMap';
import LedgerView from '../components/LedgerView';
import OrdersPanel from '../components/OrdersPanel';
import DemandBoard from '../components/DemandBoard';
import { StarDisplay } from '../components/RatingStars';

function RiskBadge({ listingId }) {
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    api.get(`/risk/listing/${listingId}`).then((res) => setRisk(res.data)).catch(() => {});
  }, [listingId]);

  if (!risk || risk.riskLevel === 'none') return null;

  const styles = {
    low: 'bg-[#FAEEDA] text-[#854F0B]',
    elevated: 'bg-[#FAECE7] text-[#993C1D]'
  };

  return (
    <div className={`mt-2 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${styles[risk.riskLevel] || styles.low}`} title={risk.flags.map((f) => f.message).join(' ')}>
      Risk agent: {risk.flags[0].message}
    </div>
  );
}

function FarmerRating({ farmerId }) {
  const [rating, setRating] = useState(null);

  useEffect(() => {
    api.get(`/ratings/user/${farmerId}`).then((res) => setRating(res.data)).catch(() => {});
  }, [farmerId]);

  if (!rating) return null;
  return <StarDisplay average={rating.average} count={rating.count} />;
}

function BidRow({ listing, onBid }) {
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await api.post('/bids', { listingId: listing.id, pricePerKg: Number(price) });
      setFeedback(res.data.accepted ? 'Bid accepted — shipment is now being routed.' : res.data.reason);
      if (res.data.accepted) onBid();
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Could not place bid.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-line rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-ink">{listing.crop} · Grade {listing.grade}</div>
          <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-2">
            <span>{listing.quantityKg} kg · {listing.farmerName}</span>
            <FarmerRating farmerId={listing.farmerId} />
          </div>
        </div>
        <div className="font-mono text-sm text-forest">₹{listing.askPrice}/kg ask</div>
      </div>
      <form onSubmit={submit} className="flex gap-2 mt-3">
        <input
          type="number"
          step="0.1"
          required
          placeholder="Your bid ₹/kg"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
        />
        <button disabled={busy} className="bg-forest text-sage font-semibold px-4 rounded-lg text-sm disabled:opacity-60">
          {busy ? '…' : 'Bid'}
        </button>
      </form>
      {feedback && <p className="text-xs text-ink-soft mt-2">{feedback}</p>}
      <RiskBadge listingId={listing.id} />
    </div>
  );
}

export default function BuyerDashboard() {
  const [listings, setListings] = useState([]);
  const [cropFilter, setCropFilter] = useState('all');

  const load = () => {
    api.get('/listings', { params: { status: 'active' } }).then((res) => setListings(res.data.listings));
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('bid:accepted', load);
    return () => socket.off('bid:accepted', load);
  }, []);

  const crops = ['all', ...new Set(listings.map((l) => l.crop))];
  const filtered = cropFilter === 'all' ? listings : listings.filter((l) => l.crop === cropFilter);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest">Sourcing marketplace</h1>
          <p className="text-ink-soft mt-1">Bid directly on verified farmer listings. No middleman markup.</p>
        </div>
        <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm bg-white">
          {crops.map((c) => <option key={c} value={c}>{c === 'all' ? 'All crops' : c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-line rounded-2xl p-8 text-center text-ink-soft">
          No active listings right now — check back soon, or ask a farmer contact to list on BHOOMI.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((listing) => (
            <BidRow key={listing.id} listing={listing} onBid={load} />
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-5">
        <OrdersPanel role="buyer" />
        <LedgerView />
      </div>

      <DemandBoard role="buyer" />

      <div className="bg-card border border-line rounded-2xl p-5">
        <div className="text-sm font-semibold text-forest mb-4">Logistics agent — live route demo</div>
        <RouteMap />
      </div>
    </div>
  );
}
