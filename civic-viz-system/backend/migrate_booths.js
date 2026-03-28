/**
 * Migration: Add booth table + update voters/complaints schemas
 * Safe to run multiple times (uses try/catch for each column)
 */
const Database = require('better-sqlite3');
const path = require('path');
const booths = require('./booths.json');

const db = new Database(path.join(__dirname, 'civic_viz.db'));

console.log('=== Booth System Migration v3.0 ===\n');

function safeAddColumn(table, column, type, defaultVal) {
  try {
    const def = defaultVal !== undefined ? ` DEFAULT '${defaultVal}'` : '';
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}${def};`);
    console.log(`  ✓ ${table}.${column} added`);
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log(`  ~ ${table}.${column} already exists`);
    } else {
      throw e;
    }
  }
}

// 1. Create booths table
console.log('[1/4] Creating booths table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS booths (
    booth_id   TEXT PRIMARY KEY,
    booth_name TEXT NOT NULL,
    area       TEXT NOT NULL,
    ward_number INTEGER,
    pincodes   TEXT,
    lat        REAL,
    lng        REAL
  );
`);

// 2. Seed booth data
console.log('[2/4] Seeding booth data...');
const insertBooth = db.prepare(`
  INSERT OR REPLACE INTO booths (booth_id, booth_name, area, ward_number, pincodes, lat, lng)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const seedBooths = db.transaction(() => {
  for (const b of booths) {
    insertBooth.run(b.booth_id, b.booth_name, b.area, b.ward_number, JSON.stringify(b.pincodes), b.lat, b.lng);
  }
});
seedBooths();
console.log(`  ✓ ${booths.length} booths seeded`);

// 3. Add columns to voters table
console.log('\n[3/4] Updating voters table...');
safeAddColumn('voters', 'address', 'TEXT', '');
safeAddColumn('voters', 'pincode', 'TEXT', '');
safeAddColumn('voters', 'booth_id', 'TEXT', '');
safeAddColumn('voters', 'phone', 'TEXT', '');
safeAddColumn('voters', 'email', 'TEXT', '');

// 4. Add columns to complaints table (some may already exist)
console.log('\n[4/4] Updating complaints table...');
safeAddColumn('complaints', 'area', 'TEXT', '');

// Backfill area from booth_id where missing
const boothMap = {};
for (const b of booths) boothMap[b.booth_id] = b.area;

const existingComplaints = db.prepare("SELECT id, booth_id FROM complaints WHERE (area IS NULL OR area = '') AND booth_id IS NOT NULL").all();
const updateArea = db.prepare("UPDATE complaints SET area = ? WHERE id = ?");
let backfilled = 0;
const backfillTx = db.transaction(() => {
  for (const c of existingComplaints) {
    const area = boothMap[c.booth_id] || '';
    if (area) { updateArea.run(area, c.id); backfilled++; }
  }
});
backfillTx();
console.log(`  ✓ Backfilled area for ${backfilled} complaints`);

// Create unregistered_users table for guest registrations
console.log('\n[+] Creating unregistered_users table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS unregistered_users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    address    TEXT,
    pincode    TEXT,
    area       TEXT,
    booth_id   TEXT,
    phone      TEXT,
    createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('  ✓ unregistered_users table ready');

console.log('\n=== Booth Migration Complete ===');
db.close();
