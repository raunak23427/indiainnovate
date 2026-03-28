const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

try {
  db.prepare('ALTER TABLE complaints ADD COLUMN address TEXT DEFAULT ""').run();
  console.log('Address column added successfully.');
} catch(e) {
  if (e.message.includes('duplicate column')) {
    console.log('Address column already exists.');
  } else {
    console.error(e.message);
  }
}
