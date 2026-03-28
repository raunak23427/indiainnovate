const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

console.log('Attaching realistic images to all complaints based on category...');

// Category mapping to realistic Unsplash images
const IMAGE_MAP = {
  Water: [
    'https://images.unsplash.com/photo-1588656722020-0be65582f3c7?auto=format&fit=crop&w=400&q=80', // water puddle/leak
    'https://images.unsplash.com/photo-1542044801-31d044073357?auto=format&fit=crop&w=400&q=80', // plumbing pipe
  ],
  Electricity: [
    'https://images.unsplash.com/photo-1498612781530-179836e52eb5?auto=format&fit=crop&w=400&q=80', // power lines
    'https://images.unsplash.com/photo-1544253394-bb06bbbc1c9a?auto=format&fit=crop&w=400&q=80', // spark / electricity
  ],
  Roads: [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80', // pothole
    'https://images.unsplash.com/photo-1520623821013-1b91e92d9f48?auto=format&fit=crop&w=400&q=80', // broken road
  ],
  Sanitation: [
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80', // garbage dump
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80', // trash bags
  ],
  Infrastructure: [
    'https://images.unsplash.com/photo-1590579491624-f98f36d4c763?auto=format&fit=crop&w=400&q=80', // broken bridge / construction
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80', // ruined building
  ],
  Pollution: [
    'https://images.unsplash.com/photo-1611273426858-450d8e814323?auto=format&fit=crop&w=400&q=80', // smoke/smog
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80', // waste
  ],
  Parks: [
    'https://images.unsplash.com/photo-1582216894082-cd27cace0903?auto=format&fit=crop&w=400&q=80', // overgrown park/bench
  ],
  Safety: [
    'https://images.unsplash.com/photo-1582068060856-42dcae0fb0e3?auto=format&fit=crop&w=400&q=80', // broken street light / dark alley
  ],
  Other: [
    'https://images.unsplash.com/photo-1628469340277-c9183d29a1b6?auto=format&fit=crop&w=400&q=80', // generic alert / issue
  ]
};

// Also attach generic resolution images for completed/resolved ones
const RESOLUTION_IMAGES = [
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=80', // people working
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80', // construction fix
  'https://images.unsplash.com/photo-1416879598446-0bbda3424106?auto=format&fit=crop&w=400&q=80', // clean street
];

const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const complaints = db.prepare('SELECT id, category, status FROM complaints').all();
const update = db.prepare('UPDATE complaints SET imageUrl = ?, resolution_image = ? WHERE id = ?');

let count = 0;
db.transaction(() => {
  for (const c of complaints) {
    const images = IMAGE_MAP[c.category] || IMAGE_MAP.Other;
    const issueImg = getRand(images);
    
    // If it's resolved or completed, give it a resolution proof photo too
    let resImg = null;
    if (['Resolved', 'Completed'].includes(c.status)) {
      resImg = getRand(RESOLUTION_IMAGES);
    }
    
    update.run(issueImg, resImg, c.id);
    count++;
  }
})();

console.log(`✓ Attached photos to ${count} complaints!`);
db.close();
