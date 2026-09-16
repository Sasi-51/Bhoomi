import { useEffect, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import RatingStars from './RatingStars';
import ShipmentTracker from './ShipmentTracker';

function FreshnessGauge({ score }) {
  const color = score >= 75 ? '#0F6E56' : score >= 45 ? '#8A5E17' : '#993C1D';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-line overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-mono" style={{ color }}>{score.toFixed(0)}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    escrowed: 'bg-[#FAEEDA] text-[#854F0B]',
    released: 'bg-[#E1F5EE] text-[#0F6E56]',
    refunded: 'bg-[#FAECE7] text-[#993C1D]'
  };
  const label = { escrowed: 'In escrow', released: 'Released', refunded: 'Refunded' };
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>{label[status]}</span>;
}

function DisputeRaiseToggle({ shipment, onRaised }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/disputes', { shipmentId: shipment.id, reason });
      onRaised(res.data.dispute);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not raise dispute.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[11px] text-ink-soft underline mt-2 block">
        Report an issue instead
      </button>
    );
  }

  return (
    <div className="mt-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What went wrong?"
        rows={2}
        className="w-full border border-line rounded-lg px-3 py-2 text-xs"
      />
      <div className="flex gap-2 mt-1.5">
        <button onClick={submit} disabled={busy || !reason.trim()} className="bg-[#993C1D] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50">
          {busy ? 'Submitting…' : 'Raise dispute'}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-ink-soft">Cancel</button>
      </div>
      {error && <p className="text-[11px] text-[#993C1D] mt-1">{error}</p>}
    </div>
  );
}

function DisputeRespond({ dispute, onResolved }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const respond = async (action) => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/disputes/${dispute.id}/respond`, { action, note });
      onResolved(res.data.dispute);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not respond.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-line">
      <div className="bg-[#FAECE7] rounded-lg p-3">
        <div className="text-xs font-semibold text-[#993C1D] mb-1">Dispute raised</div>
        <p className="text-xs text-ink mb-2">"{dispute.reason}"</p>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          className="w-full border border-line rounded-lg px-3 py-1.5 text-xs mb-2 bg-white"
        />
        <div className="flex gap-2">
          <button onClick={() => respond('refund')} disabled={busy} className="flex-1 bg-forest text-sage text-xs font-semibold py-1.5 rounded-lg disabled:opacity-50">
            Refund buyer
          </button>
          <button onClick={() => respond('contest')} disabled={busy} className="flex-1 border border-line text-ink text-xs font-semibold py-1.5 rounded-lg disabled:opacity-50 bg-white">
            Contest
          </button>
        </div>
        {error && <p className="text-[11px] text-[#993C1D] mt-1.5">{error}</p>}
      </div>
    </div>
  );
}

function RatingPrompt({ shipment, counterpartLabel }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!stars) return;
    setBusy(true);
    setError('');
    try {
      await api.post('/ratings', { shipmentId: shipment.id, stars, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit rating.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return <p className="text-xs text-[#0F6E56] font-medium mt-3 pt-3 border-t border-line">Thanks — your rating was recorded.</p>;
  }

  return (
    <div className="mt-3 pt-3 border-t border-line">
      <div className="text-[11px] text-ink-soft mb-1.5">Rate the {counterpartLabel.toLowerCase()} on this order</div>
      <RatingStars value={stars} onChange={setStars} size={18} />
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment"
        className="w-full border border-line rounded-lg px-3 py-1.5 text-xs mt-2"
      />
      <button
        onClick={submit}
        disabled={!stars || busy}
        className="mt-2 bg-forest text-sage text-xs font-semibold px-3.5 py-1.5 rounded-lg disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Submit rating'}
      </button>
      {error && <p className="text-[11px] text-[#993C1D] mt-1.5">{error}</p>}
    </div>
  );
}

function OrderCard({ shipment, isBuyer, onReleased, alreadyRated, dispute, onDisputeChanged }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showTracker, setShowTracker] = useState(false);
  const counterpartLabel = shipment.farmerId === user.id ? 'Buyer' : 'Farmer';
  const isFarmer = shipment.farmerId === user.id;

  const release = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/payments/${shipment.id}/release`);
      onReleased(res.data.shipment);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not release payment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-line rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-ink">{shipment.crop} · {shipment.quantityKg} kg</div>
          <div className="text-xs text-ink-soft mt-0.5">
            {counterpartLabel} order · ₹{shipment.pricePerKg}/kg · {shipment.distanceKm} km route ({shipment.savingsPct}% saved)
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-forest">₹{shipment.payment.amount}</div>
          <div className="mt-1"><StatusBadge status={shipment.payment.status} /></div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <div>
          <div className="text-[11px] text-ink-soft mb-1">Freshness</div>
          <FreshnessGauge score={shipment.freshnessScore} />
        </div>
        <div className="text-right">
          <div className="text-[11px] text-ink-soft mb-1">Shipment status</div>
          <span className="text-xs font-medium text-ink capitalize">{shipment.status.replace('_', ' ')}</span>
        </div>
      </div>

      {shipment.status === 'in_transit' && (
        <button
          onClick={() => setShowTracker((v) => !v)}
          className="text-[11px] font-semibold text-indigo-2 mt-3"
        >
          {showTracker ? 'Hide live tracking ▲' : 'Track shipment (3D live map) ▼'}
        </button>
      )}
      {showTracker && shipment.status === 'in_transit' && <ShipmentTracker shipment={shipment} />}

      {shipment.status === 'in_transit' && shipment.payment.status === 'escrowed' && isBuyer && (
        <div className="mt-3 pt-3 border-t border-line">
          <button
            onClick={release}
            disabled={busy}
            className="w-full bg-marigold text-forest font-semibold text-sm py-2 rounded-lg disabled:opacity-60"
          >
            {busy ? 'Releasing…' : 'Confirm delivery & release payment'}
          </button>
          <p className="text-[11px] text-ink-soft mt-1.5 text-center">Demo escrow — no real money moves. VPA: {shipment.payment.vpa}</p>
          {error && <p className="text-xs text-[#993C1D] mt-1 text-center">{error}</p>}
          <DisputeRaiseToggle shipment={shipment} onRaised={onDisputeChanged} />
        </div>
      )}

      {shipment.status === 'disputed' && dispute?.status === 'open' && (
        isFarmer ? (
          <DisputeRespond dispute={dispute} onResolved={onDisputeChanged} />
        ) : (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="bg-[#FAEEDA] text-[#854F0B] rounded-lg p-3 text-xs">
              Dispute open — awaiting farmer response. You reported: "{dispute.reason}"
            </div>
          </div>
        )
      )}

      {dispute?.status === 'escalated' && (
        <div className="mt-3 pt-3 border-t border-line">
          <div className="bg-[#FAECE7] text-[#993C1D] rounded-lg p-3 text-xs">
            Farmer contested this dispute — needs manual review (not automated in this demo).
          </div>
        </div>
      )}

      {shipment.payment.status === 'released' && !alreadyRated && (
        <RatingPrompt shipment={shipment} counterpartLabel={counterpartLabel} />
      )}
    </div>
  );
}

export default function OrdersPanel({ role }) {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [pendingRatingIds, setPendingRatingIds] = useState(new Set());
  const [disputesByShipment, setDisputesByShipment] = useState({});

  const load = () => {
    api.get('/payments/mine').then((res) => setShipments(res.data.shipments));
    api.get('/ratings/mine/pending').then((res) => {
      setPendingRatingIds(new Set(res.data.pending.map((s) => s.id)));
    });
    api.get('/disputes/mine').then((res) => {
      const byShipment = {};
      res.data.disputes.forEach((d) => {
        if (d.status !== 'resolved') byShipment[d.shipmentId] = d;
      });
      setDisputesByShipment(byShipment);
    });
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    socket.on('payment:released', refresh);
    socket.on('bid:accepted', refresh);
    socket.on('dispute:new', refresh);
    socket.on('dispute:resolved', refresh);
    socket.on('iot:reading', ({ shipmentId, freshnessScore }) => {
      setShipments((prev) => prev.map((s) => (s.id === shipmentId ? { ...s, freshnessScore } : s)));
    });
    return () => {
      socket.off('payment:released', refresh);
      socket.off('bid:accepted', refresh);
      socket.off('dispute:new', refresh);
      socket.off('dispute:resolved', refresh);
    };
  }, []);

  const onReleased = (updated) => {
    setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setPendingRatingIds((prev) => new Set(prev).add(updated.id));
  };

  const earned = shipments
    .filter((s) => s.farmerId === user.id && s.payment.status === 'released')
    .reduce((sum, s) => sum + s.payment.amount, 0);
  const pending = shipments
    .filter((s) => s.farmerId === user.id && s.payment.status === 'escrowed')
    .reduce((sum, s) => sum + s.payment.amount, 0);

  return (
    <div className="bg-card border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-forest">My orders</div>
        {role === 'farmer' && (
          <div className="text-right text-xs">
            <span className="text-[#0F6E56] font-semibold">₹{earned.toFixed(0)} earned</span>
            <span className="text-ink-soft"> · ₹{pending.toFixed(0)} in escrow</span>
          </div>
        )}
      </div>

      {shipments.length === 0 ? (
        <p className="text-sm text-ink-soft">
          {role === 'farmer' ? 'Once a bid on your listing clears, the order and escrow status will appear here.' : 'Bids you win will appear here with live delivery and escrow tracking.'}
        </p>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => (
            <OrderCard
              key={s.id}
              shipment={s}
              isBuyer={role === 'buyer'}
              onReleased={onReleased}
              alreadyRated={s.payment.status === 'released' && !pendingRatingIds.has(s.id)}
              dispute={disputesByShipment[s.id]}
              onDisputeChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
