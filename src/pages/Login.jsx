import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'farmer' ? '/farmer' : '/buyer');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log in. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-semibold text-forest mb-2">Welcome back</h1>
      <p className="text-ink-soft mb-8">Log in to your BHOOMI account.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line rounded-lg px-3.5 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-indigo-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line rounded-lg px-3.5 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-indigo-2"
          />
        </div>
        {error && <p className="text-sm text-[#993C1D]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-forest text-sage py-2.5 rounded-lg font-semibold hover:bg-forest-2 transition-colors disabled:opacity-60"
        >
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-ink-soft mt-6">
        New to BHOOMI? <Link to="/register" className="text-forest font-semibold">Create an account</Link>
      </p>
    </div>
  );
}
