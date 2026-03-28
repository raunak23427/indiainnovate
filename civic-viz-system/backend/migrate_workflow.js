const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

console.log('Running Workflow Schema Migration v1.5...');

try {
  db.exec(`
    ALTER TABLE complaints ADD COLUMN assigned_by_admin TEXT DEFAULT '';
    ALTER TABLE complaints ADD COLUMN completed_at DATETIME;
    ALTER TABLE complaints ADD COLUMN final_status TEXT DEFAULT '';
    ALTER TABLE complaints ADD COLUMN admin_review_note TEXT DEFAULT '';
  `);
  console.log('Columns added successfully.');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('Columns already exist, proceeding...');
  } else {
    console.error('Error adding columns:', error.message);
  }
}

console.log('Migration Complete.');
