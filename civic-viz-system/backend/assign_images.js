const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

// Assign the 5 real civic problem images to complaints of matching categories
// cycling across ALL complaints so they all get a real photo
const imageMap = {
  'Electricity':    '/uploads/prob_electricity.png',
  'Street Lig':     '/uploads/prob_electricity.png',
  'Drainage':       '/uploads/prob_drainage.png',
  'Water Supp':     '/uploads/prob_drainage.png',
  'Sanitation':     '/uploads/prob_garbage1.png',
  'Garbage Co':     '/uploads/prob_garbage1.png',
  'Pollution':      '/uploads/prob_garbage2.jpg',
  'Public San':     '/uploads/prob_garbage2.jpg',
  'Infrastructure': '/uploads/prob_infrastructure.jpg',
  'Road Damag':     '/uploads/prob_infrastructure.jpg',
  'Corruption':     '/uploads/prob_infrastructure.jpg',
};

// Apply matching images per category
let total = 0;
for (const [cat, img] of Object.entries(imageMap)) {
  const res = db.prepare(
    `UPDATE complaints SET imageUrl = ? WHERE category LIKE ? AND (imageUrl IS NULL OR imageUrl = '')`
  ).run(img, `${cat}%`);
  total += res.changes;
  console.log(`  ${cat}: updated ${res.changes} rows → ${img}`);
}

// Fill remaining with alternating images
const fallbacks = [
  '/uploads/prob_garbage1.png',
  '/uploads/prob_garbage2.jpg',
  '/uploads/prob_drainage.png',
  '/uploads/prob_electricity.png',
  '/uploads/prob_infrastructure.jpg',
];
const remaining = db.prepare(`SELECT id FROM complaints WHERE imageUrl IS NULL OR imageUrl = ''`).all();
remaining.forEach((r, i) => {
  const img = fallbacks[i % fallbacks.length];
  db.prepare(`UPDATE complaints SET imageUrl = ? WHERE id = ?`).run(img, r.id);
});
total += remaining.length;
console.log(`\nAssigned fallback images to ${remaining.length} remaining records.`);
console.log(`Total updated: ${total} complaints now have real civic problem images!`);
