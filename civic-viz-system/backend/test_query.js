const Database = require('better-sqlite3');
const db = new Database('civic_viz.db');

console.time("Raw Query without view");
const rawData = db.prepare(`
  SELECT b.area as _id, COUNT(c.id) as count, SUM(CASE WHEN c.status != 'Resolved' THEN 1 ELSE 0 END) as unresolved_count 
  FROM complaints c
  JOIN booths b ON c.booth_id = b.booth_id
  GROUP BY b.area
  ORDER BY b.area
`).all();
console.timeEnd("Raw Query without view");

console.log(rawData.slice(0, 2));
db.close();
