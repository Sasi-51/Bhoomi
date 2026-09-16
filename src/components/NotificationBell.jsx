import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  const load = () => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data.notifications);
      setUnread(res.data.unread);
    });
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const onNew = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnread((n) => n + 1);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openPanel = async () => {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      await api.post('/notifications/read-all');
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={openPanel}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-lg border border-line flex items-center justify-center hover:bg-sage-2 transition-colors"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1A241F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-marigold-dark text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto scrollbar-thin bg-card border border-line rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 border-b border-line text-sm font-semibold text-forest">Notifications</div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-soft text-center">Nothing yet — bid and delivery updates will show up here.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-line last:border-0 text-sm">
                <p className="text-ink leading-snug">{n.message}</p>
                <span className="text-[11px] text-ink-soft">{timeAgo(n.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
