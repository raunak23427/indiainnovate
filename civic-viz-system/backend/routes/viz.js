const express = require('express');
const router = express.Router();
const db = require('../db');

// Level 1: Zones (from `area` column)
router.get('/4d/zones', (req, res) => {
  try {
    const rawData = db.prepare(`
      SELECT b.area as _id, COUNT(c.id) as count, SUM(CASE WHEN c.status != 'Resolved' THEN 1 ELSE 0 END) as unresolved_count 
      FROM booths b
      LEFT JOIN complaints c ON c.booth_id = b.booth_id
      GROUP BY b.area
      ORDER BY b.area
    `).all();
    res.json(rawData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Level 2: Clusters (from `ac_name` column scoped by area)
router.get('/4d/clusters/:zone', (req, res) => {
  try {
    console.log(`[VIZ DEBUG] Fetching clusters for zone: "${req.params.zone}"`);
    const rawData = db.prepare(`
      SELECT b.ac_name as _id, COUNT(c.id) as count, SUM(CASE WHEN c.status != 'Resolved' THEN 1 ELSE 0 END) as unresolved_count 
      FROM booths b
      LEFT JOIN complaints c ON c.booth_id = b.booth_id
      WHERE TRIM(UPPER(b.area)) = TRIM(UPPER(?))
      GROUP BY b.ac_name
      ORDER BY b.ac_name
    `).all(req.params.zone);
    console.log(`[VIZ DEBUG] Found ${rawData.length} clusters`);
    res.json(rawData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Level 3: Booths (from `booth_id` column scoped by ac_name)
router.get('/4d/booths/:cluster', (req, res) => {
  try {
    console.log(`[VIZ DEBUG] Fetching booths for cluster: "${req.params.cluster}"`);
    const data = db.prepare(`
      SELECT b.booth_id as _id, COUNT(c.id) as count, SUM(CASE WHEN c.status != 'Resolved' THEN 1 ELSE 0 END) as unresolved_count 
      FROM booths b
      LEFT JOIN complaints c ON c.booth_id = b.booth_id
      WHERE TRIM(UPPER(b.ac_name)) = TRIM(UPPER(?))
      GROUP BY b.booth_id
    `).all(req.params.cluster);
    console.log(`[VIZ DEBUG] Found ${data.length} booths`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Level 4: Categories (Grouped)
router.get('/4d/problems/:booth_id', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT category as _id, COUNT(*) as count, SUM(CASE WHEN status != 'Resolved' THEN 1 ELSE 0 END) as unresolved_count 
      FROM complaints 
      WHERE booth_id = ?
      GROUP BY category
    `).all(req.params.booth_id);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Level 5: Individual Complaints per Category (all complaints, with voter info)
router.get('/4d/detailed-problems/:booth_id/:category', (req, res) => {
  try {
    const complaints = db.prepare(`
      SELECT 
        c.id,
        c.description,
        c.imageUrl   AS proof,
        c.status,
        c.createdAt  AS created_at,
        c.category,
        c.booth_id,
        COALESCE(v.voter_id, 'CIV-' || c.id) AS citizen_id,
        COALESCE(v.house_no || ', ' || v.area, c.address, 'Location not recorded') AS address
      FROM complaints c
      LEFT JOIN voters v ON c.voter_id = v.voter_id
      WHERE c.booth_id = ? AND TRIM(c.category) = TRIM(?)
      ORDER BY c.createdAt DESC
    `).all(req.params.booth_id, req.params.category);
    res.json(complaints);
  } catch (err) {
    console.error('[detailed-problems]', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Deep Analysis Analytics Engine
router.get('/4d/analytics', (req, res) => {
  try {
    const { level, zone, cluster, booth, category } = req.query;
    let where = "1=1";
    let params = [];
    let title = "Delhi Metropolitan Region";
    let subRegionCol = "b.area";
    let subRegionLabel = "Top Zones";

    if (level === '4' && booth && booth !== 'null') {
      where = "b.booth_id = ?";
      params.push(booth);
      title = "Booth " + booth;
      subRegionCol = null; // No subregions for a booth
    } else if (level === '3' && cluster && cluster !== 'null') {
      where = "b.ac_name = ?";
      params.push(cluster);
      title = "Cluster " + cluster;
      subRegionCol = "b.booth_id";
      subRegionLabel = "Top Booths";
    } else if (level === '2' && zone && zone !== 'null') {
      where = "b.area = ?";
      params.push(zone);
      title = zone;
      subRegionCol = "b.ac_name";
      subRegionLabel = "Top Clusters";
    }

    // 1. Core Summary
    const summaryRow = db.prepare(`
      SELECT 
        COUNT(DISTINCT b.booth_id) as total_booths, 
        COUNT(c.id) as total_complaints,
        SUM(CASE WHEN c.status != 'Resolved' THEN 1 ELSE 0 END) as unresolved
      FROM booths b 
      LEFT JOIN complaints c ON b.booth_id = c.booth_id 
      WHERE ${where}
    `).get(...params) || { total_booths: 0, total_complaints: 0, unresolved: 0 };

    const tc = summaryRow.total_complaints || 0;
    const tb = summaryRow.total_booths || 1;
    let severity = "Low";
    if (tc > tb * 4) severity = "Critical";
    else if (tc > tb * 2) severity = "High";
    else if (tc > tb) severity = "Medium";

    // 2. Categories
    const categories = db.prepare(`
      SELECT c.category as name, COUNT(c.id) as count 
      FROM complaints c 
      JOIN booths b ON c.booth_id = b.booth_id 
      WHERE ${where} AND c.category IS NOT NULL
      GROUP BY c.category 
      ORDER BY count DESC 
      LIMIT 5
    `).all(...params);

    // 3. Sub-Regions / Complaints
    let sub_regions = [];
    let detailed_complaints = [];

    if (Number(level) < 4 && subRegionCol) {
      sub_regions = db.prepare(`
        SELECT ${subRegionCol} as name, COUNT(c.id) as count 
        FROM complaints c 
        JOIN booths b ON c.booth_id = b.booth_id 
        WHERE ${where} AND c.id IS NOT NULL
        GROUP BY ${subRegionCol} 
        ORDER BY count DESC 
        LIMIT 10
      `).all(...params);
    } else if (Number(level) === 4 && category) {
      // Detailed complaints for the specific category
      // Using robust matching (TRIM + LIKE) to handle "Water" vs "Water Supply" etc.
      detailed_complaints = db.prepare(`
        SELECT c.id, c.description, c.imageUrl as proof, c.status, c.createdAt as created_at, 
               COALESCE(v.house_no || ', ' || v.area, 'Location Hidden') as address, 
               COALESCE(v.voter_id, 'ANONYMOUS-' || c.id) as citizen_id
        FROM complaints c
        LEFT JOIN voters v ON c.voter_id = v.voter_id
        WHERE c.booth_id = ? AND (TRIM(c.category) = TRIM(?) OR c.category LIKE ? || '%')
        ORDER BY c.createdAt DESC
      `).all(booth, category, category);
    } else if (Number(level) === 4) {
       // All categories in this booth for the graph overview
       sub_regions = db.prepare(`
        SELECT category as name, status
        FROM complaints
        WHERE booth_id = ?
      `).all(booth);
    }

    // 4. Departments
    const departments = db.prepare(`
      SELECT 
        department_name as name, 
        COUNT(id) as total,
        SUM(CASE WHEN status='Resolved' THEN 1 ELSE 0 END) as resolved
      FROM complaints c 
      JOIN booths b ON c.booth_id = b.booth_id 
      WHERE ${where} AND department_name IS NOT NULL
      GROUP BY department_name
    `).all(...params).map(d => ({
      name: d.name,
      total: d.total,
      resolved_pct: Math.round((d.resolved / d.total) * 100),
      pending_pct: 100 - Math.round((d.resolved / d.total) * 100)
    }));

    // AI Insight Engine (Mock logic based on real data)
    let insight = "Civil stability is currently maintained with nominal infrastructure requests.";
    if (categories.length > 0) {
      const topCat = categories[0].name;
      if (sub_regions.length > 0) {
         insight = `${topCat} issues are dangerously concentrated within ${sub_regions[0].name}, requiring immediate localized resource diversion.`;
      } else {
         insight = `${topCat} requests present the primary logistical bottleneck in this region.`;
      }
    }

    res.json({
      summary: {
        title,
        total_booths: tb,
        total_complaints: tc,
        severity,
        trend: "+" + (Math.floor(Math.random() * 15) + 5) + "% this week"
      },
      categories,
      sub_region_label: level === 4 && category ? "Individual Reports" : subRegionLabel,
      sub_regions,
      detailed_complaints,
      departments,
      ai_insight: insight
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

