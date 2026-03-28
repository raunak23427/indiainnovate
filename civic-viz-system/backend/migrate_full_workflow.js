const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

console.log('=== Running Full Workflow Migration v2.0 ===');

// Helper: safely add a column (ignore if already exists)
function safeAddColumn(table, column, type, defaultVal) {
  try {
    const def = defaultVal !== undefined ? ` DEFAULT '${defaultVal}'` : '';
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}${def};`);
    console.log(`  ✓ Added: ${column}`);
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log(`  ~ Already exists: ${column}`);
    } else {
      console.error(`  ✗ Error adding ${column}:`, e.message);
    }
  }
}

console.log('\n[1/2] Migrating complaints table...');

// From migrate_dept.js (may already exist)
safeAddColumn('complaints', 'department_name', 'TEXT', '');
safeAddColumn('complaints', 'assigned_department', 'TEXT', '');
safeAddColumn('complaints', 'assigned_at', 'DATETIME', null);
safeAddColumn('complaints', 'department_response', 'TEXT', '');
safeAddColumn('complaints', 'response_timestamp', 'DATETIME', null);
safeAddColumn('complaints', 'address', 'TEXT', '');

// From migrate_workflow.js (may already exist)
safeAddColumn('complaints', 'assigned_by_admin', 'TEXT', '');
safeAddColumn('complaints', 'completed_at', 'DATETIME', null);
safeAddColumn('complaints', 'final_status', 'TEXT', '');
safeAddColumn('complaints', 'admin_review_note', 'TEXT', '');

// NEW: resolution image stored by department
safeAddColumn('complaints', 'resolution_image', 'TEXT', '');

console.log('\n[2/2] Backfilling department_name from category...');
const deptMapping = {
  'Water Supply': 'Jal Board',
  'Electricity': 'Power Department',
  'Road Damage': 'Public Works Department (PWD)',
  'Sanitation': 'Municipal Corporation',
  'Garbage Collection': 'Municipal Corporation',
  'Drainage': 'Sewerage Department',
  'Street Lights': 'Electricity Department',
  'Public Safety': 'Police Department',
  'Infrastructure': 'Development Authority',
  'Corruption': 'Vigilance Commission',
  'Pollution': 'Environmental Board',
  'Water': 'Jal Board',
  'Roads': 'Public Works Department (PWD)',
  'Other': 'General Administration',
  'Parks': 'Municipal Corporation',
  'Safety': 'Police Department',
};

const updateStmt = db.prepare("UPDATE complaints SET department_name = ? WHERE category = ? AND (department_name IS NULL OR department_name = '')");
let total = 0;
const tx = db.transaction(() => {
  for (const [cat, dept] of Object.entries(deptMapping)) {
    const r = updateStmt.run(dept, cat);
    total += r.changes;
  }
});
tx();
console.log(`  ✓ Backfilled department_name for ${total} complaints.`);

console.log('\n=== Migration Complete ===');
db.close();
