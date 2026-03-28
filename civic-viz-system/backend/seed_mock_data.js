/**
 * seed_mock_data.js
 * Seeds 100 booths with 1200+ realistic complaints for intense graph visualization.
 * RUN ONCE: node seed_mock_data.js
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'civic_viz.db'));

// ── Extra 25 booths (to bring total to 100 alongside the 75 from booths.json) ──
const EXTRA_BOOTHS = [
  { booth_id: 'DL-076', area: 'Dwarka',       ward: 4  },
  { booth_id: 'DL-077', area: 'Rohini',       ward: 8  },
  { booth_id: 'DL-078', area: 'Saket',        ward: 9  },
  { booth_id: 'DL-079', area: 'Laxmi Nagar',  ward: 11 },
  { booth_id: 'DL-080', area: 'Janakpuri',    ward: 13 },
  { booth_id: 'DL-081', area: 'Pitampura',    ward: 15 },
  { booth_id: 'DL-082', area: 'Karol Bagh',   ward: 17 },
  { booth_id: 'DL-083', area: 'Uttam Nagar',  ward: 19 },
  { booth_id: 'DL-084', area: 'Govindpuri',   ward: 21 },
  { booth_id: 'DL-085', area: 'Mayur Vihar',  ward: 23 },
  { booth_id: 'DL-086', area: 'Preet Vihar',  ward: 24 },
  { booth_id: 'DL-087', area: 'Shahdara',     ward: 26 },
  { booth_id: 'DL-088', area: 'Vikaspuri',    ward: 28 },
  { booth_id: 'DL-089', area: 'Narela',       ward: 30 },
  { booth_id: 'DL-090', area: 'Mustafabad',   ward: 31 },
  { booth_id: 'DL-091', area: 'Patel Nagar',  ward: 33 },
  { booth_id: 'DL-092', area: 'Vasant Kunj',  ward: 35 },
  { booth_id: 'DL-093', area: 'Tilak Nagar',  ward: 36 },
  { booth_id: 'DL-094', area: 'Model Town',   ward: 38 },
  { booth_id: 'DL-095', area: 'Chandni Chowk', ward: 40 },
  { booth_id: 'DL-096', area: 'Paharganj',    ward: 41 },
  { booth_id: 'DL-097', area: 'Patparganj',   ward: 42 },
  { booth_id: 'DL-098', area: 'Hari Nagar',   ward: 43 },
  { booth_id: 'DL-099', area: 'Dwarka',       ward: 4  },
  { booth_id: 'DL-100', area: 'Rohini',       ward: 7  },
];

// Insert extra booths into booths table
const insertBooth = db.prepare(`INSERT OR IGNORE INTO booths (booth_id, booth_name, area, ward_number, pincodes, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const b of EXTRA_BOOTHS) {
  insertBooth.run(b.booth_id, `${b.area} Extended Polling Station ${b.booth_id}`, b.area, b.ward, '[]', 28.6 + Math.random() * 0.2, 77.1 + Math.random() * 0.3);
}

// ── All 100 booth IDs ─────────────────────────────────────────────────────────
const allBooths = [
  ...Array.from({ length: 75 }, (_, i) => `DL-${String(i+1).padStart(3,'0')}`),
  ...EXTRA_BOOTHS.map(b => b.booth_id),
];

// Boot → area map
const boothAreaMap = {};
try {
  const rows = db.prepare('SELECT booth_id, area FROM booths').all();
  for (const r of rows) boothAreaMap[r.booth_id] = r.area;
} catch {}

// ── Complaint templates ───────────────────────────────────────────────────────
const CATEGORIES = [
  'Water', 'Electricity', 'Roads', 'Sanitation',
  'Infrastructure', 'Pollution', 'Parks', 'Safety', 'Other'
];

const DEPT_MAP = {
  Water:          'Jal Board',
  Electricity:    'Power Department',
  Roads:          'Public Works Department (PWD)',
  Sanitation:     'Municipal Corporation',
  Infrastructure: 'Development Authority',
  Pollution:      'Environmental Board',
  Parks:          'Municipal Corporation',
  Safety:         'Police Department',
  Other:          'General Administration',
};

const DESCRIPTIONS = {
  Water: [
    'Tap water supply has been irregular for the past 10 days. Residents facing severe shortage.',
    'Dirty, brown-coloured water coming from taps. Foul smell detected. Health risk.',
    'Water pipeline burst on main road causing road waterlogging and waste.',
    'No water supply since 3 days in Block B. Senior citizens unable to manage.',
    'Water tanker not arriving on scheduled time. Residents standing in queue since morning.',
    'Underground water pipeline leakage detected near community park. Water wastage.',
    'Drinking water contaminated. Multiple residents reported stomach illness.',
    'Water meter showing wrong reading. Billing issues persisting for 2 months.',
  ],
  Electricity: [
    'Power cut for over 12 hours. Transformers burnt near Sector 5. No update from department.',
    'Street lights not working for 15 days on main stretch. Safety hazard at night.',
    'Loose electrical wires hanging from pole near school. Child safety risk.',
    'Frequent voltage fluctuations damaging home appliances. Serious concern.',
    'Electricity bill amount doubled overnight without any explanation from department.',
    'New connection applied 3 months ago but no action taken by power department.',
    'Transformer overloaded, sparks visible. No action despite multiple complaints.',
    'Power lines touching tree branches. Fire hazard during dry season.',
  ],
  Roads: [
    'Massive pothole on main approach road causing accidents. 2 bikes damaged yesterday.',
    'Road under construction for 8 months with no completion in sight. Blocked for traffic.',
    'Footpath completely broken. Elderly and disabled citizens cannot walk safely.',
    'Speed breakers removed without notice. Vehicles speeding through residential area.',
    'Road waterlogging during rains due to blocked drainage. Persistent every monsoon.',
    'Divider damaged on highway stretch. No barriers for 200m section. Accident prone.',
    'Uneven road surface after pipeline repair. Work done poorly causing bumpy ride.',
    'No road markings or zebra crossing at school gate. Children at risk.',
  ],
  Sanitation: [
    'Garbage not collected for over 5 days. Bins overflowing. Mosquito breeding.',
    'Open drain near market area. Foul smell affecting local businesses and residents.',
    'Community toilet block locked and non-functional. Residents forced to use open areas.',
    'Garbage dump site near housing society causing health hazard and smell.',
    'Sanitation workers not coming since a week. Filth accumulating in street.',
    'Drainage blocked causing sewage overflow on street. Unhygienic conditions.',
    'Waste burning happening near park daily. Air quality severely affected.',
    'Dead animals not being removed by MCD. Decomposing on road for 2 days.',
  ],
  Infrastructure: [
    'Boundary wall of park collapsed. Stray animals entering. Security compromised.',
    'Community hall roof leaking since last monsoon. No repair done yet.',
    'Public benches in garden broken and never replaced. Park unusable for elderly.',
    'Street name boards missing in entire block. Navigation difficult for visitors.',
    'Encroachment on footpath by shops. Pedestrians forced onto road.',
    'Overhead bridge has cracks in pillars. Structural safety concern.',
    'Government school building in dilapidated condition. Plaster falling from roof.',
    'Bus stop shelter destroyed. Commuters standing in rain and sun without cover.',
  ],
  Pollution: [
    'Factory near residential area releasing black smoke continuously.',
    'Loud generator running through night causing noise pollution. Unable to sleep.',
    'Illegal dumping of industrial waste in drain. Water body getting polluted.',
    'Construction dust not controlled. No water spraying or barriers in place.',
    'Burning of plastic waste happening openly near residential block every evening.',
    'Loud music from wedding venue at odd hours. Noise breach. No police action.',
    'Diesel vehicles idling near school releasing harmful fumes near children.',
    'Chemical smell coming from nearby workshop. Residents experiencing headaches.',
  ],
  Parks: [
    'Park gates locked in mornings. Residents unable to do morning walk.',
    'Swings and slides in park broken. Children getting hurt.',
    'Park lights not working. Gang activity at night due to darkness.',
    'Garden not maintained. Grass overgrown. Mosquito breeding happening.',
    'Tree fell in storm 2 weeks ago. Still blocking park path. Not cleared.',
    'Stray dogs creating menace in park. Biting children. Action required.',
    'Drinking water tap in park broken. No replacement done by authorities.',
    'Park benches vandalized. No replacement or action taken.',
  ],
  Safety: [
    'CCTV cameras installed in area are non-functional for months.',
    'Street crime incidents increasing at night. No police patrol.',
    'Suspicious activity reported at abandoned building. Police not responding.',
    'Chain snatching on main road. Three incidents this week. Urgent patrolling needed.',
    'Drug peddling reported near school gate in evenings. Immediate action needed.',
    'Illegal parking blocking emergency vehicle access to hospital.',
    'Unverified persons staying at rented accommodation. Tenant verification pending.',
    'Harassment of women at night near metro station. No action by police.',
  ],
  Other: [
    'Ration shop distributing less than entitled quantity. Corruption suspected.',
    'Government documents not being processed. Officers demanding bribe.',
    'Pension not received for 3 months despite all documents submitted.',
    'Caste-based discrimination complaint by resident against local authority.',
    'Land encroachment by neighbour. Official complaint pending for 6 months.',
    'Voter ID card correction request pending for over a year.',
    'School admission wrongly denied. Single mother unable to get help.',
    'Property tax receipt not being issued despite payment.',
  ],
};

const STATUSES = [
  'Pending', 'Pending', 'Pending',          // 30% pending
  'Assigned', 'Assigned',                    // 20% assigned
  'In Progress', 'In Progress',              // 20% in progress
  'Completed',                               // 10% completed (awaiting review)
  'Resolved',                                // 10% resolved
  'Reopened',                                // 10% reopened
];

const FINAL_STATUSES = {
  Completed: 'AwaitingReview',
  Resolved:  'Resolved',
  Reopened:  'Reopened',
};

const VOTER_PREFIXES = ['DLH', 'RPR', 'KBG', 'NRL'];
const NAMES = ['Amit Kumar', 'Priya Sharma', 'Rahul Gupta', 'Sunita Devi', 'Rajesh Singh', 'Meena Kumari',
  'Suresh Yadav', 'Anita Verma', 'Vijay Pandey', 'Kavita Joshi', 'Ravi Malhotra', 'Sonia Arora',
  'Deepak Mishra', 'Geeta Nair', 'Manoj Tiwari', 'Rekha Mehta', 'Arun Srivastava', 'Pooja Dubey',
  'Vinod Chauhan', 'Nisha Rawat', 'Prakash Bose', 'Uma Choubey', 'Satish Tripathi', 'Lata Aggarwal'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function makeDaysAgo(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(randInt(6, 22), randInt(0, 59), randInt(0, 59));
  return dt.toISOString().slice(0, 19).replace('T', ' ');
}

// How many complaints per booth (heavy distribution)
function complaintsForBooth(boothId) {
  const num = parseInt(boothId.split('-')[1]);
  // Reducing these values so total complaints are roughly 3 * 9 categories = 27 max
  if (num <= 20) return randInt(10, 15);
  return randInt(5, 10);
}

console.log('=== Seeding Mock Civic Complaint Data ===');
console.log(`Targeting all 100 booths...\n`);

// Keep existing complaints, only add new ones
const existingCount = db.prepare('SELECT COUNT(*) as c FROM complaints').get().c;
console.log(`Existing complaints: ${existingCount}`);

const insert = db.prepare(`
  INSERT INTO complaints (
    voter_id, booth_id, category, description, status,
    final_status, department_name, area, address,
    assigned_department, adminComments, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let totalInserted = 0;

const seedAll = db.transaction(() => {
  for (const boothId of allBooths) {
    const area = boothAreaMap[boothId] || 'Delhi';
    const count = complaintsForBooth(boothId);

    for (let i = 0; i < count; i++) {
      const category = rand(CATEGORIES);
      const status = rand(STATUSES);
      const finalStatus = FINAL_STATUSES[status] || '';
      const dept = DEPT_MAP[category];
      const assignedDept = ['Assigned', 'In Progress', 'Completed', 'Resolved'].includes(status) ? dept : '';
      const voterId = `${rand(VOTER_PREFIXES)}${randInt(10000000, 99999999)}`;
      const desc = rand(DESCRIPTIONS[category]);
      const address = `Block-${String.fromCharCode(65 + randInt(0, 7))}, ${area}, New Delhi`;
      const daysAgo = randInt(1, 180);
      const adminNotes = ['In Progress', 'Completed', 'Resolved'].includes(status)
        ? rand(['Issue noted, team dispatched.', 'Site inspection done.', 'Work order issued.', 'Follow-up scheduled.', ''])
        : '';

      insert.run(
        voterId, boothId, category, desc, status,
        finalStatus, dept, area, address,
        assignedDept, adminNotes, makeDaysAgo(daysAgo)
      );
      totalInserted++;
    }
  }
});

seedAll();

const newTotal = db.prepare('SELECT COUNT(*) as c FROM complaints').get().c;
console.log(`✓ Inserted ${totalInserted} new complaints`);
console.log(`✓ Total complaints now: ${newTotal}`);
console.log(`✓ Spread across 100 booths`);

// Print distribution summary
const byStatus = db.prepare(`
  SELECT status, COUNT(*) as cnt FROM complaints GROUP BY status ORDER BY cnt DESC
`).all();
console.log('\nStatus Breakdown:');
for (const row of byStatus) {
  const bar = '█'.repeat(Math.floor(row.cnt / 10));
  console.log(`  ${row.status.padEnd(15)} ${String(row.cnt).padStart(5)}  ${bar}`);
}

const topBooths = db.prepare(`
  SELECT booth_id, COUNT(*) as cnt FROM complaints GROUP BY booth_id ORDER BY cnt DESC LIMIT 10
`).all();
console.log('\nTop 10 Booths by Volume:');
for (const row of topBooths) {
  console.log(`  ${row.booth_id}  →  ${row.cnt} complaints`);
}

db.close();
console.log('\n=== Done! Restart backend and refresh /viz ===');
