const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'civic_viz.db'));

console.log('Clearing old booths and complaints...');
db.exec('DELETE FROM booths;');
db.exec('DELETE FROM complaints;');

const CATEGORIES = ['Water', 'Electricity', 'Roads', 'Sanitation', 'Infrastructure', 'Pollution', 'Parks', 'Safety', 'Other'];
const DEPT_MAP = {
  Water: 'Jal Board', Electricity: 'Power Department', Roads: 'Public Works Department (PWD)',
  Sanitation: 'Municipal Corporation', Infrastructure: 'Development Authority', Pollution: 'Environmental Board',
  Parks: 'Municipal Corporation', Safety: 'Police Department', Other: 'General Administration'
};

const DELHI_ZONES = [
  "New Delhi", "North Delhi", "North West Delhi", "West Delhi", "South West Delhi", 
  "South Delhi", "South East Delhi", "Central Delhi", "North East Delhi", "Shahdara"
];

const DELHI_LOCALITIES = [
  "Dwarka", "Saket", "Vasant Kunj", "Hauz Khas", "Rohini", "Janakpuri", 
  "Karol Bagh", "Pitampura", "Lajpat Nagar", "Rajouri Garden", "Okhla", 
  "Mayur Vihar", "Paschim Vihar", "Punjabi Bagh", "Kirti Nagar", "Malviya Nagar", 
  "Nehru Place", "Connaught Place", "Chanakyapuri", "Green Park", "Vasant Vihar",
  "Greater Kailash", "Defense Colony", "Model Town", "Civil Lines"
];

const STATUSES = ['Pending', 'Pending', 'Pending', 'Assigned', 'In Progress', 'In Progress', 'Completed', 'Resolved', 'Reopened'];
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const insertBooth = db.prepare(`
  INSERT INTO booths (booth_id, booth_name, area, ac_id, ac_name, lat, lng)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertComplaint = db.prepare(`
  INSERT INTO complaints (voter_id, booth_id, category, description, status, final_status, department_name, area, address)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let boothCount = 0;
let complaintCount = 0;

db.transaction(() => {
  for (let z = 1; z <= 10; z++) {
    const zoneName = DELHI_ZONES[z-1]; // Real Delhi Zone
    
    // Anomaly: Zone 3 gets 100 Clusters. Others 20.
    const clusterTarget = (z === 3) ? 100 : 20;

    for (let c = 1; c <= clusterTarget; c++) {
      const loc = rand(DELHI_LOCALITIES);
      const clusterName = `${loc} Sector ${c}`; // Real locality hybrid
      const fullClusterLabel = `${zoneName} | ${clusterName}`;
      
      // 50 Booths per Cluster
      for (let b = 1; b <= 50; b++) {
        // Guaranteed globally unique ID
        const boothId = `Z${String(z).padStart(2,'0')}-${loc.substring(0,3).toUpperCase()}-C${String(c).padStart(2,'0')}-B${String(b).padStart(2,'0')}`;
        const pollingStation = `Polling Booth ${b}, ${loc}`;
        const acId = `AC-${z}-${c}`;
        
        const lat = 28.5 + (Math.random() * 0.4);
        const lng = 77.0 + (Math.random() * 0.4);
        
        insertBooth.run(boothId, pollingStation, zoneName, acId, fullClusterLabel, lat, lng);
        boothCount++;
        
        // EVERY BOOTH GETS AT LEAST 3 COMPLAINTS PER CATEGORY
        for (const category of CATEGORIES) {
          const cCount = 3; // Exactly 3 complaints per category
          const dept = DEPT_MAP[category];

          for (let i = 0; i < cCount; i++) {
            const status = rand(STATUSES);
            const finalStatus = status === 'Completed' ? 'AwaitingReview' : (status === 'Resolved' || status === 'Reopened' ? status : '');
            const voterId = `DLH${Math.floor(10000000 + Math.random() * 90000000)}`;
            const msg = `Extreme density anomaly logged in ${zoneName}`;
            const address = `Block ${Math.floor(Math.random()*10)}, ${clusterName}`;
            
            insertComplaint.run(voterId, boothId, category, msg, status, finalStatus, dept, zoneName, address);
            complaintCount++;
          }
        }
      }
    }
  }
})();

console.log(`✓ Inserted ${boothCount} literal Delhi booths.`);
console.log(`✓ Inserted ${complaintCount} civic complaints strictly mapped to real-world taxonomy.`);
db.close();
