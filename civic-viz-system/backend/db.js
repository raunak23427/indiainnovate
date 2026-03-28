const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'civic_viz.db'), { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS voters (
    voter_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    father_name TEXT,
    house_no TEXT,
    age INTEGER,
    gender TEXT,
    booth_id TEXT NOT NULL,
    area TEXT
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voter_id TEXT NOT NULL,
    booth_id TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    imageUrl TEXT,
    status TEXT DEFAULT 'Pending',
    resolutionProofUrl TEXT,
    adminComments TEXT,
    longitude REAL DEFAULT 0,
    latitude REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
