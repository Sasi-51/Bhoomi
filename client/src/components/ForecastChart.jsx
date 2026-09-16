import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ForecastChart({ history }) {
  if (!history || !history.length) {
    return <div className="text-sm text-ink-soft">No price history yet.</div>;
  }

  const data = history.map((p) => ({
    date: new Date(p.t).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    price: p.price
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#E1E6D6" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4A5750' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#4A5750' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #D8DCCD', fontSize: 12 }}
          formatter={(value) => [`₹${value}/kg`, 'Price']}
        />
        <Line type="monotone" dataKey="price" stroke="#8A5E17" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
