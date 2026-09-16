import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 bg-sage/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center text-marigold font-display font-bold">B</span>
          <span className="font-display text-lg font-semibold text-forest tracking-tight">bhoomi</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <NotificationBell />
              <Link
                to={user.role === 'farmer' ? '/farmer' : '/buyer'}
                className="text-sm font-medium text-ink-soft hover:text-forest transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-sm text-ink-soft hidden sm:inline">{user.name}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-sm font-semibold border border-forest text-forest px-4 py-2 rounded-lg hover:bg-forest hover:text-sage transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-forest transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-forest text-sage px-4 py-2 rounded-lg hover:bg-forest-2 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
