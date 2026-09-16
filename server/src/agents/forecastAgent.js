// Forecast agent - predicts near-term demand per crop.
// Default mode: a transparent statistical model (moving average + linear trend
// over the stored mandi price history) so the feature works with zero API keys.
// Upgrade path: if ANTHROPIC_API_KEY is set, natural-language questions from
// farmers ("what should I plant next?") are answered by Claude, grounded in the
// same price history data passed in the prompt - this is the real-world pattern
// for adding an LLM on top of a deterministic core rather than replacing it.

function linearTrend(series) {
  const n = series.length;
  const xs = series.map((_, i) => i);
  const ys = series.map((p) => p.price);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return slope; // price change per day
}

function movingAverage(series, window) {
  const slice = series.slice(-window);
  return slice.reduce((a, b) => a + b.price, 0) / slice.length;
}

function demandIndex(series) {
  const slope = linearTrend(series);
  const recentAvg = movingAverage(series, 7);
  const olderAvg = movingAverage(series.slice(0, -7), 7);
  const momentum = olderAvg ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  // simple composite score, 0-100, blending trend slope and recent momentum
  const raw = 50 + slope * 25 + momentum * 1.5;
  return Math.max(0, Math.min(100, Number(raw.toFixed(1))));
}

function statisticalForecast(crop, series) {
  const idx = demandIndex(series);
  const last = series[series.length - 1].price;
  const projected = Number((last * (1 + (idx - 50) / 400)).toFixed(2));
  const trend = idx >= 60 ? 'rising' : idx <= 40 ? 'falling' : 'stable';
  return {
    crop,
    demandIndex: idx,
    trend,
    currentPrice: last,
    projected30dPrice: projected,
    source: 'statistical',
    message:
      trend === 'rising'
        ? `${crop} demand is trending up (index ${idx}/100). Prices projected near ₹${projected}/kg over the next cycle.`
        : trend === 'falling'
        ? `${crop} looks oversupplied in recent data (index ${idx}/100). Consider staggering harvest or diversifying.`
        : `${crop} demand looks stable (index ${idx}/100). No major shift expected next cycle.`
  };
}

async function askForecastAgent({ crop, question, history }) {
  const series = history[crop];
  const base = statisticalForecast(crop, series);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ...base, answer: base.message, source: 'statistical' };
  }

  try {
    const summary = series
      .slice(-10)
      .map((p) => `${new Date(p.t).toISOString().slice(0, 10)}: ₹${p.price}`)
      .join(', ');

    const prompt = `You are the forecast agent inside BHOOMI, an agricultural marketplace. ` +
      `A farmer asked: "${question || 'What should I know about this crop right now?'}" about ${crop}. ` +
      `Recent mandi price history (last 10 days): ${summary}. ` +
      `Computed demand index: ${base.demandIndex}/100 (trend: ${base.trend}). ` +
      `Answer in 2-3 short, practical sentences a smallholder farmer can act on. No preamble.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) throw new Error(`LLM request failed: ${res.status}`);
    const json = await res.json();
    const text = (json.content || []).map((b) => b.text || '').join(' ').trim();

    return { ...base, answer: text || base.message, source: 'llm' };
  } catch (err) {
    console.error('[forecastAgent] LLM call failed, falling back to statistical model:', err.message);
    return { ...base, answer: base.message, source: 'statistical' };
  }
}

module.exports = { statisticalForecast, askForecastAgent, demandIndex };
