const db = require('./db');
['address', 'phone', 'email'].forEach(col => {
  try {
    db.prepare(`ALTER TABLE voters ADD COLUMN ${col} TEXT`).run();
    console.log(`Added ${col}`);
  } catch (e) {
    if(!e.message.includes('duplicate')) console.log(e.message);
  }
});
