const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'civic_viz.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = OFF'); // Faster for batch

console.log("Fetching data...");
const booths = db.prepare('SELECT booth_id FROM booths').all().map(b => b.booth_id);
const complaints = db.prepare('SELECT id FROM complaints').all();

console.log(`Syncing ${complaints.length} complaints to ${booths.length} booths...`);

const updateStmt = db.prepare('UPDATE complaints SET booth_id = ? WHERE id = ?');

const CHUNK_SIZE = 50000;
for (let i = 0; i < complaints.length; i += CHUNK_SIZE) {
  const chunk = complaints.slice(i, i + CHUNK_SIZE);
  const syncChunk = db.transaction(() => {
    chunk.forEach((complaint, index) => {
      const overallIndex = i + index;
      updateStmt.run(booths[overallIndex % booths.length], complaint.id);
    });
  });
  syncChunk();
  console.log(`  Processed ${Math.min(i + CHUNK_SIZE, complaints.length)} / ${complaints.length} complaints...`);
}

console.log('FAST CHUNKED SYNC COMPLETE');
