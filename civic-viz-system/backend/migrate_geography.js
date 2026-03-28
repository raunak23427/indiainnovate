const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'civic_viz.db'));

const newGeography = {
  "ZN-1": {
    name: "Central Delhi",
    clusters: [
      "Connaught Place", "Karol Bagh", "Paharganj", "Rajendra Place", "Patel Nagar",
      "Daryaganj", "Chandni Chowk", "Civil Lines", "Kashmere Gate", "Minto Road",
      "ITO", "Delhi Gate", "Jhandewalan", "Rani Jhansi Road", "Bengali Market"
    ]
  },
  "ZN-2": {
    name: "South Delhi",
    clusters: [
      "Saket", "Malviya Nagar", "Hauz Khas", "Green Park", "Vasant Kunj",
      "Mehrauli", "Chhatarpur", "Greater Kailash 1", "Greater Kailash 2", "Nehru Place",
      "Kalkaji", "Defence Colony", "Lajpat Nagar", "Jangpura", "Bhikaji Cama Place"
    ]
  },
  "ZN-3": {
    name: "East Delhi",
    clusters: [
      "Laxmi Nagar", "Preet Vihar", "Mayur Vihar Phase 1", "Mayur Vihar Phase 2", "Mayur Vihar Phase 3",
      "Pandav Nagar", "Karkardooma", "Anand Vihar", "Vivek Vihar", "Shahdara",
      "Dilshad Garden", "Krishna Nagar", "Geeta Colony", "Gandhi Nagar", "Seemapuri"
    ]
  },
  "ZN-4": {
    name: "West Delhi",
    clusters: [
      "Rajouri Garden", "Punjabi Bagh", "Janakpuri", "Tilak Nagar", "Subhash Nagar",
      "Uttam Nagar", "Dwarka Sector 1", "Dwarka Sector 6", "Dwarka Sector 10", "Dwarka Sector 21",
      "Vikaspuri", "Paschim Vihar", "Nangloi", "Kirti Nagar", "Moti Nagar"
    ]
  },
  "ZN-5": {
    name: "North West Delhi",
    clusters: [
      "Rohini Sector 1", "Rohini Sector 3", "Rohini Sector 7", "Rohini Sector 9", "Rohini Sector 13",
      "Rohini Sector 18", "Pitampura", "Shalimar Bagh", "Ashok Vihar", "Wazirpur",
      "Keshav Puram", "Bawana", "Narela", "Mangolpuri", "Sultanpuri"
    ]
  },
  "ZN-6": {
    name: "North Delhi",
    clusters: [
      "Model Town", "Kamla Nagar", "GTB Nagar", "Mukherjee Nagar", "Burari",
      "Timarpur", "Azadpur", "Adarsh Nagar", "Jahangirpuri", "Majnu Ka Tila",
      "Shakti Nagar", "Kingsway Camp", "Sabzi Mandi", "Nirankari Colony", "Sant Nagar"
    ]
  },
  "ZN-7": {
    name: "South West Delhi",
    clusters: [
      "Dwarka Sector 22", "Palam", "Dabri", "Najafgarh", "Kapashera",
      "Mahipalpur", "Vasant Vihar", "Munirka", "RK Puram", "Sarojini Nagar",
      "Naraina", "Delhi Cantonment", "Dhaula Kuan", "Chanakyapuri", "Shankar Vihar"
    ]
  },
  "ZN-8": {
    name: "South East Delhi",
    clusters: [
      "Okhla Phase 1", "Okhla Phase 2", "Okhla Phase 3", "Jamia Nagar", "Batla House",
      "Shaheen Bagh", "Sarita Vihar", "Jasola", "New Friends Colony", "Maharani Bagh",
      "Sukhdev Vihar", "Govindpuri", "Tughlakabad", "Badarpur", "Kalkaji Extension"
    ]
  },
  "ZN-9": {
    name: "Outer Delhi",
    clusters: [
      "Alipur", "Kanjhawala", "Mundka", "Tikri Kalan", "Najafgarh Rural",
      "Bakkarwala", "Mitraon", "Jharoda Kalan", "Qutubgarh", "Holambi Kalan",
      "Ghoga", "Harewali", "Karala", "Pooth Khurd", "Dichaon Kalan"
    ]
  },
  "ZN-10": {
    name: "North East Delhi",
    clusters: [
      "Seelampur", "Welcome", "Jafrabad", "Maujpur", "Yamuna Vihar",
      "Bhajnpura", "Gokalpuri", "Karawal Nagar", "Dayalpur", "Sonia Vihar",
      "Khajuri Khas", "Mustafabad", "Babarpur", "Subhash Mohalla", "Shastri Park"
    ]
  }
};

// Also handle the currently used area names (if not ZN-X)
const areaMapping = {
  "Central Delhi": "ZN-1",
  "South Delhi": "ZN-2",
  "East Delhi": "ZN-3",
  "West Delhi": "ZN-4",
  "North West Delhi": "ZN-5",
  "North Delhi": "ZN-6",
  "South West Delhi": "ZN-7",
  "South East Delhi": "ZN-8",
  "Outer Delhi": "ZN-9",
  "North East Delhi": "ZN-10"
};

db.transaction(() => {
  // Get all unique zones in DB
  const currentAreas = db.prepare("SELECT DISTINCT area FROM booths").all();
  
  Object.entries(newGeography).forEach(([znId, zoneData]) => {
    // Determine which area in DB corresponds to this znId
    // If DB is ZN-1, it matches znId directly.
    // If DB is "Central Delhi", we use areaMapping to find ZN-1.
    const targetArea = currentAreas.find(a => a.area === znId || areaMapping[a.area] === znId);
    
    if (targetArea) {
      console.log(`Updating Zone: ${targetArea.area} -> ${zoneData.name}`);
      
      // Update the area name in booths
      db.prepare("UPDATE booths SET area = ? WHERE area = ?").run(zoneData.name, targetArea.area);
      
      // Get all clusters for this area
      const clusters = db.prepare("SELECT DISTINCT ac_name FROM booths WHERE area = ?").all(zoneData.name);
      
      clusters.forEach((cluster, idx) => {
        let newClusterName;
        if (idx < zoneData.clusters.length) {
          // Normal mapping
          newClusterName = `${zoneData.name} | ${zoneData.clusters[idx]}`;
        } else {
          // Option B: Generic names for extra clusters
          newClusterName = `${zoneData.name} | Area ${idx + 1}`;
        }
        
        console.log(`  Updating Cluster: ${cluster.ac_name} -> ${newClusterName}`);
        db.prepare("UPDATE booths SET ac_name = ? WHERE area = ? AND ac_name = ?").run(newClusterName, zoneData.name, cluster.ac_name);
      });
    }
  });
})();

console.log("Database migration complete!");
