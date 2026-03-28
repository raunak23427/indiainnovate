const fs = require('fs');
const db = require('./db');
const row = db.prepare('SELECT * FROM unregistered_users WHERE id = 2').get();
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE name='unregistered_users'").get();
fs.writeFileSync('debug_user.json', JSON.stringify({ row, schema }, null, 2));
console.log('Done');
