const db = require('./db');
const path = require('path');

const complaints = [
  {
    voter_id: 'V-1001', 
    booth_id: 'Z05-CIV-C17-B1',
    category: 'Water Supply',
    description: 'Systemic water logging in Dwarka Sector 12 after yesterday\'s rainfall. Basement levels are flooded and drainage is completely choked.',
    proof: '/uploads/proof_water.png',
    address: 'H-42, Sector 12 Dwarka, New Delhi'
  },
  {
    voter_id: 'V-2002',
    booth_id: 'Z01-MOD-C10-B5',
    category: 'Roads',
    description: 'A massive crater-sized pothole has appeared near the main intersection. Extremely dangerous for two-wheelers at night.',
    proof: '/uploads/proof_road.png',
    address: 'Near Metro Pillar 442, Model Town, Delhi'
  },
  {
    voter_id: 'V-3003',
    booth_id: 'Z03-KAR-C08-B2',
    category: 'Sanitation',
    description: 'Community garbage bins are overflowing for the last 3 days. The entire sidewalk is blocked and it\'s attracting stray animals.',
    proof: '/uploads/proof_garbage.png',
    address: 'Block 8, Karol Bagh, New Delhi'
  }
];

const stmt = db.prepare(`
  INSERT INTO complaints (voter_id, booth_id, category, description, imageUrl, address, status, department_name)
  VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Municipal Corporation')
`);

db.transaction(() => {
  for (const c of complaints) {
    stmt.run(c.voter_id, c.booth_id, c.category, c.description, c.proof, c.address);
    console.log(`Added complaint for ${c.booth_id}: ${c.category}`);
  }
})();

console.log('Seeding complete.');
