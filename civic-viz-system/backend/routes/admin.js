const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db');
const { getAllBooths, getAllAreas } = require('../boothAllocator');
const { sendResolutionEmail } = require('../emailService');

const upload = multer({ dest: 'uploads/' });

// Upload Excel Voter List
router.post('/upload-excel', upload.single('file'), (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    db.prepare('DELETE FROM voters').run();
    
    const insert = db.prepare(`
      INSERT INTO voters (voter_id, name, father_name, house_no, age, gender, booth_id, area)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((voters) => {
      for (const v of voters) {
        insert.run(
          v.voter_id.toString(), v.name, v.father_name, v.house_no,
          v.age, v.gender, v.booth_id.toString(), v.area || ''
        );
      }
    });

    insertMany(data);
    res.json({ message: 'Excel data uploaded', count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all complaints (admin, with filters including booth_id/area)
router.get('/complaints', (req, res) => {
  const { booth_id, category, status, area } = req.query;
  try {
    let query = 'SELECT * FROM complaints WHERE 1=1';
    const params = [];
    if (booth_id) { query += ' AND booth_id = ?'; params.push(booth_id); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (status)   { query += ' AND status = ?';   params.push(status); }
    if (area)     { query += ' AND area = ?';      params.push(area); }
    
    query += ' ORDER BY createdAt DESC';
    const complaints = db.prepare(query).all(...params);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk assign complaints to department
router.put('/complaints/bulk-assign', (req, res) => {
  const { complaint_ids, assigned_department, assigned_by } = req.body;
  if (!complaint_ids || !Array.isArray(complaint_ids) || complaint_ids.length === 0) {
    return res.status(400).json({ error: 'No complaints selected' });
  }
  try {
    const updateStmt = db.prepare(`
      UPDATE complaints 
      SET status = 'Assigned', 
          assigned_department = ?, 
          assigned_by_admin = ?,
          assigned_at = CURRENT_TIMESTAMP,
          final_status = ''
      WHERE id = ?
    `);
    
    const updateMany = db.transaction((ids) => {
      for (const id of ids) {
        updateStmt.run(assigned_department, assigned_by || 'admin', id);
      }
    });
    
    updateMany(complaint_ids);
    res.json({ message: 'Bulk assignment successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update single complaint
router.patch('/complaints/:id', async (req, res) => {
  const { status, adminComments, resolutionProofUrl, assigned_department } = req.body;
  
  let simulatedResponse = '';
  if (status === 'Assigned') simulatedResponse = `Allocated to ${assigned_department || 'Department'}.`;
  if (status === 'In Progress') simulatedResponse = 'Under process by field agents.';
  if (status === 'Resolved') simulatedResponse = 'Work completed and verified by civic inspector.';

  try {
    const complaintId = req.params.id;
    // Get existing info to find the citizen email
    const existing = db.prepare('SELECT assigned_department, voter_id FROM complaints WHERE id = ?').get(complaintId);
    if (!existing) return res.status(404).json({ error: 'Complaint not found' });
    
    // Merge department
    const newDept = assigned_department || existing.assigned_department || '';
    
    db.prepare(`
      UPDATE complaints 
      SET status = ?, adminComments = ?, resolutionProofUrl = ?,
          department_response = ?, assigned_department = ?, response_timestamp = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, adminComments, resolutionProofUrl, simulatedResponse, newDept, complaintId);

    // Send email if marked resolved
    if (status === 'Resolved') {
      const isGuest = existing.voter_id.startsWith('GUEST-');
      const userId = isGuest ? existing.voter_id.replace('GUEST-', '') : existing.voter_id;
      
      let citizen;
      if (isGuest) citizen = db.prepare('SELECT email, name FROM unregistered_users WHERE id = ?').get(userId);
      else         citizen = db.prepare('SELECT null as email, name FROM voters WHERE voter_id = ?').get(userId); // Assuming no email for registered voters standard DB

      if (citizen && citizen.email) {
        await sendResolutionEmail(citizen.email, citizen.name, complaintId, newDept || 'Civic Department');
      }
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin review: approve or reject completed complaint
router.patch('/complaints/:id/review', (req, res) => {
  const { action, admin_review_note } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
  }
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  if (complaint.status !== 'Completed') {
    return res.status(400).json({ error: 'Complaint is not in Completed status' });
  }
  try {
    const newStatus = action === 'approve' ? 'Resolved' : 'Reopened';
    db.prepare(`
      UPDATE complaints 
      SET status = ?, final_status = ?, admin_review_note = ?, response_timestamp = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, newStatus, admin_review_note || '', req.params.id);
    res.json({ message: `Complaint ${newStatus}`, final_status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/booths ─────────────────────────────────────────────────────
// List all booths for filter dropdowns
router.get('/booths', (req, res) => {
  try {
    res.json(getAllBooths());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/areas ──────────────────────────────────────────────────────
router.get('/areas', (req, res) => {
  try {
    res.json(getAllAreas());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const totals = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN final_status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'Reopened' THEN 1 ELSE 0 END) as reopened
      FROM complaints
    `).get();

    const byArea = db.prepare(`
      SELECT area, COUNT(*) as count, 
        SUM(CASE WHEN final_status != 'Resolved' AND status != 'Resolved' THEN 1 ELSE 0 END) as unresolved
      FROM complaints WHERE area != ''
      GROUP BY area ORDER BY count DESC
    `).all();

    const byBooth = db.prepare(`
      SELECT booth_id, COUNT(*) as count,
        SUM(CASE WHEN final_status != 'Resolved' AND status != 'Resolved' THEN 1 ELSE 0 END) as unresolved
      FROM complaints
      GROUP BY booth_id ORDER BY count DESC LIMIT 20
    `).all();

    res.json({ totals, byArea, byBooth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
