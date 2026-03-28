const db = require('./db');
const b = db.prepare("SELECT * FROM booths WHERE booth_id = 'Z10-ROH-C09-B50'").get();
console.log('BOOTH:', JSON.stringify(b));
const zone = db.prepare("SELECT DISTINCT area FROM booths WHERE booth_id LIKE 'Z10%' LIMIT 1").get();
console.log('ZONE area:', zone);
const cluster = db.prepare("SELECT DISTINCT ac_name FROM booths WHERE booth_id LIKE 'Z10-ROH-C09%' LIMIT 1").get();
console.log('CLUSTER ac_name:', cluster);
