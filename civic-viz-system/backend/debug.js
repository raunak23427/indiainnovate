const db = require('./db');
const fs = require('fs');

const schema = db.prepare("SELECT sql FROM sqlite_master WHERE name='complaints'").get();
const rows = db.prepare("SELECT * FROM complaints WHERE voter_id='GUEST-1'").all();

fs.writeFileSync('debug.json', JSON.stringify({ schema, rows }, null, 2));
console.log('Done writing debug.json');
