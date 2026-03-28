const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'civic_viz.db'));

const images = {
  'Water': '/uploads/prob_drain_garbage.png',
  'Electricity': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Power_lines_in_Delhi.jpg/800px-Power_lines_in_Delhi.jpg',
  'Roads': '/uploads/prob_pothole_1.png',
  'Sanitation': '/uploads/prob_garbage_river.png',
  'Infrastructure': '/uploads/prob_waterlogged.png',
  'Pollution': '/uploads/prob_garbage_river.png',
  'Parks': '/uploads/prob_pothole_2.png',
  'Safety': '/uploads/prob_drain_garbage.png',
  'Other': '/uploads/prob_waterlogged.png',
  'Water Supply': '/uploads/prob_drain_garbage.png'
};

const defaultImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/300px-No_image_available.svg.png';

const stmt = db.prepare('UPDATE complaints SET imageUrl = ? WHERE category = ?');

db.transaction(() => {
  for (const [category, url] of Object.entries(images)) {
    stmt.run(url, category);
  }
  
  // Set default for any remaining nulls
  db.prepare("UPDATE complaints SET imageUrl = ? WHERE imageUrl IS NULL").run(defaultImage);
})();

console.log("Database updated with mock photos.");
