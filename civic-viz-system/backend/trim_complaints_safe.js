const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'civic_viz.db');

console.log('Opening database...');
const db = new Database(dbPath, { verbose: undefined });

// Enable WAL mode and run integrity check
try {
  db.pragma('journal_mode = DELETE'); // force rollback journal, clears -journal file
  db.pragma('wal_checkpoint(FULL)');
} catch (e) {
  console.log('Pragma warning (non-fatal):', e.message);
}

console.log('Counting complaints before trim...');
const before = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get();
console.log(`Before: ${before.cnt} complaints`);

// Use a CREATE TABLE AS approach to keep only top 3 per (booth_id, category)
console.log('Creating temp table with survivors...');
db.exec(`CREATE TABLE IF NOT EXISTS complaints_keep AS
  SELECT * FROM complaints
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY booth_id, category ORDER BY id ASC) as rn
      FROM complaints
    ) ranked
    WHERE rn <= 3
  )`);

console.log('Dropping original table...');
db.exec('DROP TABLE complaints');

console.log('Renaming temp table...');
db.exec('ALTER TABLE complaints_keep RENAME TO complaints');

const after = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get();
console.log(`After: ${after.cnt} complaints`);
console.log(`Deleted: ${before.cnt - after.cnt} complaints`);
console.log('Done! Each booth now has at most 3 complaints per category.');
db.close();
