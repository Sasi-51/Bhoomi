// Optional convenience script: populates a demo farmer, buyer and a few
// listings so the app has something to look at immediately after setup.
// Run with: npm run seed (from the server/ directory)

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { store, CROPS } = require('./db');
const { gradeProduce } = require('./agents/gradingAgent');

async function seed() {
  if (store.all('users').length > 0) {
    console.log('Data already exists — skipping seed. Delete the data file to reseed from scratch.');
    return;
  }

  const farmerPasswordHash = await bcrypt.hash('farmer123', 10);
  const buyerPasswordHash = await bcrypt.hash('buyer123', 10);

  const farmer = {
    id: uuid(),
    name: 'Ramesh Patil',
    email: 'farmer@bhoomi.demo',
    passwordHash: farmerPasswordHash,
    role: 'farmer',
    location: { lat: 20.15, lng: 74.05, name: 'Sinnar, Nashik' },
    createdAt: Date.now()
  };

  const buyer = {
    id: uuid(),
    name: 'Fresh Mart Wholesale',
    email: 'buyer@bhoomi.demo',
    passwordHash: buyerPasswordHash,
    role: 'buyer',
    location: { lat: 17.385, lng: 78.4867, name: 'Hyderabad, TG' },
    createdAt: Date.now()
  };

  store.insert('users', farmer);
  store.insert('users', buyer);

  const demoListings = [
    { crop: 'Tomato', quantityKg: 420, askPrice: 27, sizeScore: 88, colorScore: 90, defectScore: 6 },
    { crop: 'Onion', quantityKg: 1200, askPrice: 18, sizeScore: 80, colorScore: 78, defectScore: 12 },
    { crop: 'Wheat', quantityKg: 3000, askPrice: 24, sizeScore: 70, colorScore: 72, defectScore: 18 }
  ];

  for (const l of demoListings) {
    const { grade, gradeScore } = gradeProduce(l);
    store.insert('listings', {
      id: uuid(),
      farmerId: farmer.id,
      crop: l.crop,
      quantityKg: l.quantityKg,
      askPrice: l.askPrice,
      grade,
      gradeScore,
      status: 'active',
      createdAt: Date.now()
    });
  }

  console.log('Seed complete.');
  console.log('Demo farmer login: farmer@bhoomi.demo / farmer123');
  console.log('Demo buyer login:  buyer@bhoomi.demo / buyer123');
  console.log(`Available crops: ${CROPS.join(', ')}`);
}

seed();
