// Zero-dependency persistence layer.
// BHOOMI ships without a native database so the whole stack runs anywhere Node runs.
// Swap this module for Postgres/Mongo in production - every route only talks to
// the methods below, never to the file system directly.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', process.env.DATA_FILE || './data/bhoomi-db.json');

const CROPS = ['Tomato', 'Onion', 'Wheat', 'Spinach', 'Potato', 'Soybean'];

function seedMandiHistory() {
  const history = {};
  const basePrices = { Tomato: 21, Onion: 15, Wheat: 22, Spinach: 11, Potato: 13, Soybean: 39 };
  const now = Date.now();
  for (const crop of CROPS) {
    const series = [];
    let price = basePrices[crop];
    for (let i = 29; i >= 0; i--) {
      price = Math.max(4, price + (Math.random() - 0.48) * 1.2);
      series.push({ t: now - i * 86400000, price: Number(price.toFixed(2)) });
    }
    history[crop] = series;
  }
  return history;
}

function defaultData() {
  return {
    users: [],
    listings: [],
    bids: [],
    shipments: [],
    ledger: [],
    notifications: [],
    pushSubscriptions: [],
    ratings: [],
    demands: [],
    disputes: [],
    mandiHistory: seedMandiHistory(),
    meta: { createdAt: Date.now() }
  };
}

class JsonStore {
  constructor(file) {
    this.file = file;
    this._load();
  }

  _load() {
    try {
      const dir = path.dirname(this.file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(this.file)) {
        const loaded = JSON.parse(fs.readFileSync(this.file, 'utf-8'));
        // Backfill any collections added in later versions of this file so an
        // older data.json on disk doesn't crash a freshly updated server.
        this.data = { ...defaultData(), ...loaded };
        for (const key of Object.keys(this.data)) {
          if (this.data[key] === undefined) this.data[key] = [];
        }
      } else {
        this.data = defaultData();
        this._save();
      }
    } catch (err) {
      console.error('[db] failed to load, starting fresh:', err.message);
      this.data = defaultData();
    }
  }

  _save() {
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }

  // generic helpers -------------------------------------------------
  all(collection) {
    return this.data[collection];
  }

  find(collection, predicate) {
    return this.data[collection].find(predicate);
  }

  filter(collection, predicate) {
    return this.data[collection].filter(predicate);
  }

  insert(collection, record) {
    this.data[collection].push(record);
    this._save();
    return record;
  }

  update(collection, id, patch) {
    const idx = this.data[collection].findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data[collection][idx] = { ...this.data[collection][idx], ...patch };
    this._save();
    return this.data[collection][idx];
  }

  persist() {
    this._save();
  }
}

const store = new JsonStore(DATA_FILE);

module.exports = { store, CROPS };
