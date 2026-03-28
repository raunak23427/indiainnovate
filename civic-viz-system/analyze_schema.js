const db = require('./backend/db');
console.log('TABLES:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
try {
    const boothsTableInfo = db.prepare("PRAGMA table_info(booths)").all();
    console.log('BOOTHS SCHEMA:', JSON.stringify(boothsTableInfo, null, 2));
    const sampleBooth = db.prepare("SELECT * FROM booths LIMIT 1").all();
    console.log('SAMPLE BOOTH:', JSON.stringify(sampleBooth, null, 2));
} catch (e) {
    console.log('BOOTHS table error:', e.message);
}
