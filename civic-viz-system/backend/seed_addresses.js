const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

// Ensure address column exists
try {
  db.prepare('ALTER TABLE complaints ADD COLUMN address TEXT DEFAULT ""').run();
  console.log('Added address column.');
} catch(e) {
  console.log('Address column already exists.');
}

const areas = [
  'Block A, Sector 12, Dwarka, New Delhi',
  'Gali No. 4, Laxmi Nagar, Delhi-110092',
  'Main Market, Rohini Sector 7, Delhi',
  'Near Ram Mandir, Sadar Bazar, Delhi-110006',
  'Pocket 3, Mayur Vihar Phase 1, Delhi-110091',
  'Plot 45, Janakpuri West, Delhi-110058',
  'Opp. Metro Station, Karol Bagh, Delhi-110005',
  'MCD Colony, Shahdara, Delhi-110032',
  'Phase 2, Uttam Nagar, Delhi-110059',
  'Near Park, Mangolpuri, Delhi-110083',
  'Sector 9, Vasundhara, Ghaziabad-201012',
  'Old Delhi Road, Raj Nagar, Ghaziabad',
  'Behind Bus Stand, NIT, Faridabad-121001',
  'Nai Basti, Gurugram Sector 14, Haryana-122001',
  'Gandhi Nagar, East Delhi-110031',
  'Nehru Place Back Lane, South Delhi-110019',
  'Govindpuri Extension, Kalkaji, Delhi-110019',
  'H Block, Patel Nagar, Delhi-110008',
  'Lane 6, Pandav Nagar, Delhi-110091',
  'Near Police Chowki, Tilak Nagar, Delhi-110018',
  'Wazirabad Village Road, North Delhi-110084',
  'Opp. School, Shalimar Bagh, Delhi-110088',
  'Shakti Nagar Chowk, Civil Lines, Delhi-110007',
  'Near MCD School, Bawana Industrial Area, Delhi',
  'Sultanpuri Crossing, Delhi-110086',
  'Kirari Suleman Nagar, Delhi-110086',
  'Mundka Industrial Area, West Delhi-110041',
  'Nangloi Bus Depot Road, Delhi-110041',
  'Baprola Vihar, Dwarka Extension, Delhi',
  'Sector 23, Rohini, Delhi-110085',
];

const update = db.prepare('UPDATE complaints SET address = ? WHERE id = ?');
const complaints = db.prepare('SELECT id FROM complaints').all();

const updateMany = db.transaction((rows) => {
  rows.forEach((c, i) => {
    update.run(areas[i % areas.length], c.id);
  });
});

updateMany(complaints);
console.log(`Done! Updated ${complaints.length} complaints with realistic Indian addresses.`);
