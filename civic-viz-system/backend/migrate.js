const db = require('./db');

const cols = [
  'assigned_by_admin TEXT',
  'department_response TEXT',
  'assigned_at DATETIME',
  'final_status TEXT',
  'admin_review_note TEXT',
  'response_timestamp DATETIME'
];

cols.forEach(c => {
  try {
    db.prepare(`ALTER TABLE complaints ADD COLUMN ${c}`).run();
    console.log('Added ' + c);
  } catch(e) {
    if (e.message.includes('duplicate column')) {
      console.log(c + ' already exists');
    } else {
      console.log('Error adding ' + c + ': ' + e.message);
    }
  }
});
