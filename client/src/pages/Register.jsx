import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'farmer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(form);
      navigate(user.role === 'farmer' ? '/farmer' : '/buyer');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-semibold text-forest mb-2">Create your account</h1>
      <p className="text-ink-soft mb-8">Join BHOOMI as a farmer or a bulk buyer.</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-2 bg-sage-2 p-1 rounded-lg w-fit">
          {['farmer', 'buyer'].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setForm((f) => ({ ...f, role: r }))}
              className={`px-4 py-2 rounded-md text-sm font-semibold capitalize transition-colors ${
                form.role === r ? 'bg-forest text-sage' : 'text-ink-soft'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Full name</label>
          <input required value={form.name} onChange={update('name')} className="w-full border border-line rounded-lg px-3.5 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-indigo-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Email</label>
          <input type="email" required value={form.email} onChange={update('email')} className="w-full border border-line rounded-lg px-3.5 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-indigo-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink block mb-1.5">Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={update('password')} className="w-full border border-line rounded-lg px-3.5 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-indigo-2" />
        </div>

        {error && <p className="text-sm text-[#993C1D]">{error}</p>}
        <button type="submit" disabled={busy} className="w-full bg-forest text-sage py-2.5 rounded-lg font-semibold hover:bg-forest-2 transition-colors disabled:opacity-60">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-ink-soft mt-6">
        Already have an account? <Link to="/login" className="text-forest font-semibold">Log in</Link>
      </p>
    </div>
  );
}
