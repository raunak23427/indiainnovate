const db = require('./db');
console.log(JSON.stringify(db.prepare("SELECT * FROM complaints WHERE voter_id='GUEST-1'").all(), null, 2));
console.log(JSON.stringify(db.prepare("SELECT * FROM unregistered_users WHERE id=1").get(), null, 2));
