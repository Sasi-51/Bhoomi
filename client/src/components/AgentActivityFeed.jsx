import { useEffect, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';

const AGENT_STYLE = {
  grading: { label: 'Grading', color: '#4F8F6A' },
  pricing: { label: 'Pricing', color: '#3D5E71' },
  logistics: { label: 'Logistics', color: '#8A5E17' },
  trust: { label: 'Trust', color: '#0F6E56' },
  risk: { label: 'Risk', color: '#993C1D' }
};

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentActivityFeed({ limit = 12 }) {
  const [events, setEvents] = useState([]);

  const load = () => {
    api.get('/activity/feed', { params: { limit } }).then((res) => setEvents(res.data.events));
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    socket.on('bid:accepted', refresh);
    socket.on('payment:released', refresh);
    socket.on('dispute:new', refresh);
    socket.on('dispute:resolved', refresh);
    socket.on('ledger:new', refresh);
    return () => {
      socket.off('bid:accepted', refresh);
      socket.off('payment:released', refresh);
      socket.off('dispute:new', refresh);
      socket.off('dispute:resolved', refresh);
      socket.off('ledger:new', refresh);
    };
  }, []);

  return (
    <div className="bg-card border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-forest">Live agent activity</div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F6E56]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56] animate-pulse" />
          Live
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-ink-soft">No agent activity yet — list a crop or place a bid to see it here.</p>
      ) : (
        <div className="space-y-0 max-h-80 overflow-y-auto scrollbar-thin pr-1">
          {events.map((e) => {
            const style = AGENT_STYLE[e.agent] || { label: e.agent, color: '#4A5750' };
            return (
              <div key={e.id} className="flex items-start gap-2.5 py-2.5 border-b border-line last:border-0">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${style.color}1A`, color: style.color }}
                >
                  {style.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink leading-snug">{e.message}</p>
                  <span className="text-[10px] text-ink-soft">{timeAgo(e.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
