const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

// Department Mapping Definition
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
  'Corruption': 'Vigilance Commission', // Adding a fallback for Corruption
  'Pollution': 'Environmental Board' // Adding a fallback for Pollution
};

console.log('Running Department Schema Migration...');

try {
  // Add new columns if they do not exist
  db.exec(`
    ALTER TABLE complaints ADD COLUMN department_name TEXT DEFAULT '';
    ALTER TABLE complaints ADD COLUMN assigned_department TEXT DEFAULT '';
    ALTER TABLE complaints ADD COLUMN assigned_at DATETIME;
    ALTER TABLE complaints ADD COLUMN department_response TEXT DEFAULT '';
    ALTER TABLE complaints ADD COLUMN response_timestamp DATETIME;
  `);
  console.log('Columns added successfully.');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('Columns already exist, proceeding to backfill data...');
  } else {
    console.error('Error adding columns:', error.message);
  }
}

// Backfill department_name based on category
const updateDept = db.prepare('UPDATE complaints SET department_name = ? WHERE category = ?');

let updatedCount = 0;
const updateMany = db.transaction(() => {
  for (const [category, department] of Object.entries(deptMapping)) {
    const result = updateDept.run(department, category);
    updatedCount += result.changes;
  }
});

updateMany();

console.log(`Migration Complete. Backfilled department_name for ${updatedCount} complaints.`);
