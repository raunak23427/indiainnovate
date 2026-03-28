const db = require('./backend/db');
const result = db.prepare("SELECT DISTINCT ac_name FROM booths WHERE area = 'South West Delhi'").all();
require('fs').writeFileSync('tmp_sw_clusters.json', JSON.stringify(result, null, 2));
const booth_check = db.prepare("SELECT COUNT(*) as count FROM complaints c JOIN booths b ON c.booth_id = b.booth_id WHERE b.area = 'South West Delhi'").all();
console.log('COMPLAINTS IN SW DELHI:', booth_check);
