const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, 'civic_viz.db'));

// Read JSON files
const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock_users.json'), 'utf8'));
const complaints = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock_complaints.json'), 'utf8'));

db.exec('DELETE FROM complaints;');
db.exec('DELETE FROM voters;');

const insertUser = db.prepare(`
    INSERT INTO voters (voter_id, name, booth_id, area)
    VALUES (?, ?, ?, ?)
`);

const insertComplaint = db.prepare(`
    INSERT INTO complaints (voter_id, booth_id, category, description, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
    for (const u of users) {
        insertUser.run(u.voter_id, u.name, String(u.booth_id), u.area);
    }
    
    for (const c of complaints) {
        insertComplaint.run(c.voter_id, String(c.booth_id), c.category, c.description, c.status, c.timestamp);
    }
})();

console.log(`Seeded ${users.length} users and ${complaints.length} complaints into the database.`);
