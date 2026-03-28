const db = require('./backend/db');
const result = db.prepare("SELECT DISTINCT area, ac_name FROM booths WHERE area = 'South West Delhi' LIMIT 10").all();
console.log(JSON.stringify(result, null, 2));
const count = db.prepare("SELECT COUNT(*) as total FROM booths WHERE area = 'South West Delhi'").all();
console.log('TOTAL BOOTHS:', count);
