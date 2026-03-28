const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resolution_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Hardcoded department credentials
const deptLogins = {
  'jal@delhi.gov.in':    { dept: 'Jal Board',                     pwd: 'admin' },
  'power@delhi.gov.in':  { dept: 'Power Department',               pwd: 'admin' },
  'pwd@delhi.gov.in':    { dept: 'Public Works Department (PWD)',   pwd: 'admin' },
  'mcd@delhi.gov.in':    { dept: 'Municipal Corporation',           pwd: 'admin' },
  'sewer@delhi.gov.in':  { dept: 'Sewerage Department',             pwd: 'admin' },
  'police@delhi.gov.in': { dept: 'Police Department',               pwd: 'admin' },
  'elec@delhi.gov.in':   { dept: 'Electricity Department',          pwd: 'admin' },
  'dev@delhi.gov.in':    { dept: 'Development Authority',           pwd: 'admin' },
  'gen@delhi.gov.in':    { dept: 'General Administration',          pwd: 'admin' },
};

// POST /api/department/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = deptLogins[email?.toLowerCase()];
  if (user && user.pwd === password) {
    res.json({ success: true, department: user.dept, email });
  } else {
    res.status(401).json({ error: 'Invalid department credentials' });
  }
});

// GET /api/department/complaints?department=...&status=...
router.get('/complaints', (req, res) => {
  const { department, status, category, booth_id } = req.query;
  if (!department) return res.status(400).json({ error: 'Department required' });

  try {
    let query = 'SELECT * FROM complaints WHERE assigned_department = ?';
    const params = [department];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (booth_id) { query += ' AND booth_id = ?'; params.push(booth_id); }

    query += ' ORDER BY assigned_at DESC';
    const complaints = db.prepare(query).all(...params);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/department/complaints/:id — update status, response, image
router.patch('/complaints/:id', upload.single('resolution_image'), (req, res) => {
  const { status, department_response } = req.body;

  try {
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    // Block edits if admin already resolved/closed this complaint
    if (complaint.final_status === 'Resolved') {
      return res.status(403).json({ error: 'Complaint is already resolved by admin' });
    }

    // Allowed status transitions for departments
    const allowed = {
      'Assigned':    ['In Progress'],
      'In Progress': ['In Progress', 'Completed'],
      'Reopened':    ['In Progress', 'Completed'],
      'Completed':   ['Completed'],
    };
    const current = complaint.status;
    const allowedNext = allowed[current] || [];

    if (status && !allowedNext.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid transition: ${current} → ${status}. Allowed: ${allowedNext.join(', ')}` 
      });
    }

    const newStatus = status || complaint.status;
    const newResponse = department_response !== undefined ? department_response : complaint.department_response;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const sets = [
      'status = ?',
      'department_response = ?',
      'response_timestamp = CURRENT_TIMESTAMP',
    ];
    const params = [newStatus, newResponse];

    if (imageUrl) {
      sets.push('resolution_image = ?');
      params.push(imageUrl);
    }

    if (newStatus === 'Completed') {
      sets.push('completed_at = CURRENT_TIMESTAMP');
      sets.push("final_status = 'AwaitingReview'");
    }

    params.push(req.params.id);
    db.prepare(`UPDATE complaints SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    res.json({ message: 'Updated successfully', status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
