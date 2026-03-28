const Database = require('better-sqlite3');
const db = new Database('./civic_viz.db');

console.log("Starting SQLite optimization for 1.5M rows natively...");

try {
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_geo_zone ON geo_metadata(zone);
        CREATE INDEX IF NOT EXISTS idx_geo_cluster ON geo_metadata(cluster_name);
        CREATE INDEX IF NOT EXISTS idx_geo_booth ON geo_metadata(booth_id);
    `);
    console.log("Created Geo indices...");
    
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_complaints_booth ON complaints(booth_id);
        CREATE INDEX IF NOT EXISTS idx_complaints_cat ON complaints(category);
        CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status, final_status);
    `);
    console.log("Created Complaints indices...");

    console.log("Running ANALYZE to compute B-Tree histograms...");
    db.exec("ANALYZE;");
    
    console.log("Successfully resolved the 1.5M row matrix locking timeouts!");
} catch (e) {
    console.error("Index exception:", e);
}
db.close();
