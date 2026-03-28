const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

console.log('Clearing old complaints...');
db.exec('DELETE FROM complaints;');

// Target fully 100 booths
const TARGET_BOOTHS = Array.from({ length: 100 }, (_, i) => `DL-${String(i+1).padStart(3, '0')}`);
const boothAreaMap = {};
const rows = db.prepare('SELECT booth_id, area FROM booths').all();
for (const r of rows) boothAreaMap[r.booth_id] = r.area;

const CATEGORIES = ['Water', 'Electricity', 'Roads', 'Sanitation', 'Infrastructure', 'Pollution', 'Parks', 'Safety', 'Other'];
const DEPT_MAP = {
  Water: 'Jal Board', Electricity: 'Power Department', Roads: 'Public Works Department (PWD)',
  Sanitation: 'Municipal Corporation', Infrastructure: 'Development Authority', Pollution: 'Environmental Board',
  Parks: 'Municipal Corporation', Safety: 'Police Department', Other: 'General Administration'
};
// Skew statuses towards unresolved to guarantee high active counts
const STATUSES = ['Pending', 'Pending', 'Pending', 'Assigned', 'In Progress', 'In Progress', 'Completed', 'Resolved', 'Reopened'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const insert = db.prepare(`
  INSERT INTO complaints (voter_id, booth_id, category, description, status, final_status, department_name, area, address)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let total = 0;
db.transaction(() => {
  for (const boothId of TARGET_BOOTHS) {
    const area = boothAreaMap[boothId] || 'Delhi';
    // Reduced problems per booth to align with 3 per category (9 categories * 3 = 27)
    const count = 27;
    
    for (let i = 0; i < count; i++) {
      const category = rand(CATEGORIES);
      const status = rand(STATUSES);
      const finalStatus = status === 'Completed' ? 'AwaitingReview' : (status === 'Resolved' || status === 'Reopened' ? status : '');
      const dept = DEPT_MAP[category];
      const voterId = `DLH${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      insert.run(voterId, boothId, category, `Dense issue reported in ${area}`, status, finalStatus, dept, area, `Block ${Math.floor(Math.random()*10)}, ${area}`);
      total++;
    }
  }
})();

console.log(`✓ Inserted ${total} massive complaints across 100 booths for immense visual density.`);
db.close();
