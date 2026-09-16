import { Link } from 'react-router-dom';
import { Suspense } from 'react';
import Scene3D from '../components/Scene3D';
import RouteMap from '../components/RouteMap';
import AgentPanel from '../components/AgentPanel';
import LiveStats from '../components/LiveStats';
import AgentActivityFeed from '../components/AgentActivityFeed';

const FEATURES = [
  { title: 'Reverse-auction pricing', desc: 'Buyers bid live; a floor price pulled from real mandi data means farmers can never be undercut.' },
  { title: 'On-device quality grading', desc: 'Produce is scored the moment it is photographed — no wait, no middleman judgement call.' },
  { title: 'Route-optimised pickup', desc: 'A nearest-neighbour solver over real coordinates consolidates scattered small farms into one efficient run.' },
  { title: 'Hash-chained settlement', desc: 'Every cleared bid is written to a tamper-evident ledger the moment it settles.' },
  { title: 'Live risk screening', desc: 'A fifth agent watches every bid stream for wash-bidding and single-buyer concentration in real time.' }
];

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-marigold animate-pulse" />
              <span className="text-[13px] font-semibold text-marigold-dark">5 AI agents running live</span>
            </div>
            <h1 className="font-display text-5xl leading-[1.08] font-semibold text-forest">
              Sell direct.<br />Price fairly.<br /><em className="italic text-marigold-dark font-medium">Deliver smart.</em>
            </h1>
            <p className="mt-6 text-lg text-ink-soft leading-relaxed max-w-md">
              BHOOMI removes the chain of middlemen between farm and fork. Five autonomous agents
              forecast demand, run a live reverse auction, optimise the delivery route, screen for
              bidding risk, and settle payment the moment quality is verified.
            </p>
            <div className="flex gap-3 mt-8">
              <Link to="/register" className="bg-forest text-sage px-6 py-3 rounded-lg font-semibold hover:bg-forest-2 transition-colors">
                Get started
              </Link>
              <a href="#how-it-works" className="border border-forest text-forest px-6 py-3 rounded-lg font-semibold hover:bg-forest hover:text-sage transition-colors">
                See how it works
              </a>
            </div>
          </div>

          <div className="h-[420px] rounded-3xl">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-ink-soft text-sm">Loading scene…</div>}>
              <Scene3D />
            </Suspense>
          </div>
        </div>
      </section>

      <LiveStats />

      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
        <div className="max-w-xl mb-10">
          <span className="text-[13px] font-semibold text-marigold-dark">How it works</span>
          <h2 className="font-display text-3xl font-semibold text-forest mt-3">
            Five agents run the marketplace, not a call centre.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card border border-line rounded-2xl p-6">
              <div className="font-semibold text-ink mb-2">{f.title}</div>
              <p className="text-sm text-ink-soft leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-[1.3fr,1fr] gap-5">
        <div className="bg-card border border-line rounded-2xl p-6">
          <div className="text-sm font-semibold text-forest mb-4">Logistics agent — live route demo</div>
          <RouteMap />
        </div>
        <div className="space-y-5">
          <AgentPanel />
          <AgentActivityFeed />
        </div>
      </section>
    </div>
  );
}
