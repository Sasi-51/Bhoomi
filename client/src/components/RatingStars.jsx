export function StarDisplay({ average, count }) {
  if (average === null || average === undefined) {
    return <span className="text-[11px] text-ink-soft">No ratings yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-marigold-dark">★</span>
      <span className="font-semibold text-ink">{average.toFixed(1)}</span>
      <span className="text-ink-soft">({count})</span>
    </span>
  );
}

export default function RatingStars({ value, onChange, size = 22 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          style={{ fontSize: size, lineHeight: 1 }}
          className={n <= value ? 'text-marigold-dark' : 'text-line'}
        >
          ★
        </button>
      ))}
    </div>
  );
}
