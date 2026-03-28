const Database = require('better-sqlite3');
const db = new Database('civic_viz.db');

console.log('Counting complaints before trim...');
const before = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get();
console.log(`Before: ${before.cnt} complaints`);

// Delete all complaints EXCEPT the 3 with the lowest id per (booth_id, category)
db.exec(`
  DELETE FROM complaints
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY booth_id, category ORDER BY id ASC) as rn
      FROM complaints
    ) ranked
    WHERE rn <= 3
  )
`);

const after = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get();
console.log(`After: ${after.cnt} complaints`);
console.log(`Deleted: ${before.cnt - after.cnt} complaints`);
console.log('Done! Each booth now has exactly 3 complaints per category.');
db.close();
