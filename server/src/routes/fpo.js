// FPO-led bulk onboarding. This is the actual implementation behind the
// pitch's feasibility claim - "an FPO coordinator can bring dozens of
// farmers on at once instead of one at a time." Each row becomes a managed
// farmer profile (no login credentials required - the FPO account acts on
// their behalf) plus one listing, graded exactly like a self-service one.

const express = require('express');
const { v4: uuid } = require('uuid');
const { store, CROPS } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { gradeProduce } = require('../agents/gradingAgent');

const router = express.Router();

function findOrCreateManagedFarmer(row, fpoUser) {
  const existing = store.find(
    'users',
    (u) => u.managedByFpoId === fpoUser.id && u.name === row.name && u.phone === row.phone
  );
  if (existing) return existing;

  const farmer = {
    id: uuid(),
    name: row.name,
    phone: row.phone || null,
    email: null,
    passwordHash: null,
    role: 'farmer',
    hasLogin: false,
    managedByFpoId: fpoUser.id,
    location: {
      lat: row.lat ? Number(row.lat) : fpoUser.location?.lat,
      lng: row.lng ? Number(row.lng) : fpoUser.location?.lng,
      name: row.village || fpoUser.location?.name
    },
    createdAt: Date.now()
  };
  store.insert('users', farmer);
  return farmer;
}

// Returns the CSV column spec so the frontend can generate a template file
// without duplicating this list.
router.get('/template', (req, res) => {
  res.json({
    columns: ['name', 'phone', 'village', 'crop', 'quantityKg', 'askPrice', 'sizeScore', 'colorScore', 'defectScore'],
    notes: 'sizeScore/colorScore/defectScore are 0-100 and optional (default to a mid-range grade if omitted).'
  });
});

router.post('/bulk-import', requireAuth, requireRole('farmer'), (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows must be a non-empty array' });
  }
  if (rows.length > 500) {
    return res.status(400).json({ error: 'Maximum 500 rows per import' });
  }

  const fpoUser = store.find('users', (u) => u.id === req.user.id);
  const results = { created: 0, farmersCreated: 0, farmersReused: 0, errors: [] };
  const managedFarmerCache = new Map();

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    if (!row.name) return results.errors.push({ row: rowNum, error: 'Missing farmer name' });
    if (!row.crop || !CROPS.includes(row.crop)) {
      return results.errors.push({ row: rowNum, error: `crop must be one of: ${CROPS.join(', ')}` });
    }
    const quantityKg = Number(row.quantityKg);
    const askPrice = Number(row.askPrice);
    if (!quantityKg || quantityKg <= 0) return results.errors.push({ row: rowNum, error: 'quantityKg must be a positive number' });
    if (!askPrice || askPrice <= 0) return results.errors.push({ row: rowNum, error: 'askPrice must be a positive number' });

    const cacheKey = `${row.name}|${row.phone || ''}`;
    let farmer = managedFarmerCache.get(cacheKey);
    const alreadyExisted = !!store.find(
      'users',
      (u) => u.managedByFpoId === fpoUser.id && u.name === row.name && u.phone === row.phone
    );
    if (!farmer) {
      farmer = findOrCreateManagedFarmer(row, fpoUser);
      managedFarmerCache.set(cacheKey, farmer);
      if (alreadyExisted) results.farmersReused++;
      else results.farmersCreated++;
    }

    const { grade, gradeScore } = gradeProduce({
      sizeScore: Number(row.sizeScore) || 70,
      colorScore: Number(row.colorScore) || 70,
      defectScore: Number(row.defectScore) || 15
    });

    store.insert('listings', {
      id: uuid(),
      farmerId: farmer.id,
      crop: row.crop,
      quantityKg,
      askPrice,
      grade,
      gradeScore,
      status: 'active',
      importedByFpoId: fpoUser.id,
      createdAt: Date.now()
    });
    results.created++;
  });

  res.status(201).json(results);
});

// So an FPO coordinator's dashboard can show everyone they've onboarded.
router.get('/my-farmers', requireAuth, requireRole('farmer'), (req, res) => {
  const farmers = store.filter('users', (u) => u.managedByFpoId === req.user.id);
  const withListingCounts = farmers.map((f) => ({
    id: f.id,
    name: f.name,
    phone: f.phone,
    village: f.location?.name,
    listingCount: store.filter('listings', (l) => l.farmerId === f.id).length
  }));
  res.json({ farmers: withListingCounts });
});

module.exports = router;
