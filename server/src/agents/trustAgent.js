// Trust agent - append-only, hash-chained ledger.
// This is the same core idea a permissioned Hyperledger Fabric channel gives you
// (tamper-evidence via linked hashes) implemented in plain Node so the demo has
// zero external infrastructure. Swap `computeHash` + `store` for a real chain
// client in production without touching any caller of this module.

const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const { store } = require('../db');

function computeHash(block) {
  const payload = `${block.index}|${block.timestamp}|${JSON.stringify(block.data)}|${block.prevHash}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function genesisBlock() {
  const block = { index: 0, timestamp: Date.now(), data: { type: 'genesis' }, prevHash: '0'.repeat(64) };
  block.hash = computeHash(block);
  return block;
}

function appendBlock(data) {
  const chain = store.all('ledger');
  const prev = chain.length ? chain[chain.length - 1] : genesisBlock();
  if (!chain.length) {
    store.insert('ledger', prev);
  }
  const block = {
    id: uuid(),
    index: prev.index + 1,
    timestamp: Date.now(),
    data,
    prevHash: prev.hash
  };
  block.hash = computeHash(block);
  store.insert('ledger', block);
  return block;
}

function verifyChain() {
  const chain = store.all('ledger');
  for (let i = 1; i < chain.length; i++) {
    const block = chain[i];
    const prev = chain[i - 1];
    if (block.prevHash !== prev.hash) return { valid: false, brokenAt: block.index };
    const recomputed = computeHash({ index: block.index, timestamp: block.timestamp, data: block.data, prevHash: block.prevHash });
    if (recomputed !== block.hash) return { valid: false, brokenAt: block.index };
  }
  return { valid: true, blocks: chain.length };
}

function getChain() {
  return store.all('ledger');
}

module.exports = { appendBlock, verifyChain, getChain };
