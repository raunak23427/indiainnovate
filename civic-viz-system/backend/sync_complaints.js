const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'civic_viz.db'));
db.pragma('journal_mode = WAL');

console.log("Starting complaint synchronization...");

const booths = db.prepare('SELECT booth_id FROM booths').all().map(b => b.booth_id);
const totalBooths = booths.length;

if (totalBooths === 0) {
  console.error("No booths found! Aborting.");
  process.exit(1);
}

const complaints = db.prepare('SELECT id FROM complaints').all();
const totalComplaints = complaints.length;

console.log(`Syncing ${totalComplaints} complaints to ${totalBooths} booths...`);

const updateStmt = db.prepare('UPDATE complaints SET booth_id = ? WHERE id = ?');

db.transaction(() => {
  complaints.forEach((complaint, index) => {
    // Assign a booth in a round-robin fashion
    const targetBoothId = booths[index % totalBooths];
    updateStmt.run(targetBoothId, complaint.id);
    
    if ((index + 1) % 10000 === 0) {
      console.log(`  Processed ${index + 1} complaints...`);
    }
  });
})();

console.log("Synchronization complete! All complaints are now linked to valid Delhi booths.");
