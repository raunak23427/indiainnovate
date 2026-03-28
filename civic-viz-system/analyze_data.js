const db = require('./backend/db');
const areas = db.prepare("SELECT DISTINCT area FROM booths").all();
console.log('AREAS:', JSON.stringify(areas, null, 2));

for (const area of areas) {
    const clusters = db.prepare("SELECT DISTINCT ac_name FROM booths WHERE area = ? LIMIT 5").all(area.area);
    console.log(`CLUSTERS for ${area.area}:`, JSON.stringify(clusters, null, 2));
}
