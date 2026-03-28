const db = require('./db');

db.prepare("UPDATE complaints SET id = rowid WHERE id IS NULL").run();
db.prepare("UPDATE complaints SET status = 'Pending' WHERE status IS NULL AND final_status IS NULL").run();
db.prepare("UPDATE complaints SET createdAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL").run();

console.log('Fixed existing null rows in complaints.');
