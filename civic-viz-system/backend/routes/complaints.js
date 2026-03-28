const express = require('express');
const router = express.Router();
const db = require('../db');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getBoothById } = require('../boothAllocator');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Category → department mapping
const deptMapping = {
  'Water Supply': 'Jal Board',
  'Water': 'Jal Board',
  'Electricity': 'Power Department',
  'Road Damage': 'Public Works Department (PWD)',
  'Roads': 'Public Works Department (PWD)',
  'Sanitation': 'Municipal Corporation',
  'Garbage Collection': 'Municipal Corporation',
  'Drainage': 'Sewerage Department',
  'Street Lights': 'Electricity Department',
  'Public Safety': 'Police Department',
  'Safety': 'Police Department',
  'Infrastructure': 'Development Authority',
  'Corruption': 'Vigilance Commission',
  'Pollution': 'Environmental Board',
  'Parks': 'Municipal Corporation',
  'Other': 'General Administration',
};

// ── POST /api/complaints (submit new complaint) ────────────────────────────────
router.post('/', upload.single('image'), async (req, res) => {
  const { voter_id, booth_id, description, category: userCategory, address } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!voter_id || !booth_id || !description) {
    return res.status(400).json({ error: 'voter_id, booth_id, and description are required' });
  }

  // Auto-categorize if not provided
  let finalCategory = userCategory;
  if (!finalCategory) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Categorize this civic complaint into ONE category from: Water, Electricity, Roads, Sanitation, Infrastructure, Pollution, Parks, Safety, Other.\nComplaint: "${description}"\nReturn ONLY the category name, nothing else.`;
      const result = await model.generateContent(prompt);
      finalCategory = result.response.text().trim().split('\n')[0];
    } catch {
      finalCategory = 'Other';
    }
  }

  // Auto-fill area from booth
  const boothData = getBoothById(booth_id);
  const area = boothData?.area || '';

  // Auto-map department from category
  const deptName = deptMapping[finalCategory] || 'General Administration';

  try {
    const stmt = db.prepare(`
      INSERT INTO complaints (id, voter_id, booth_id, category, description, imageUrl, address, department_name, area, status, createdAt)
      VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM complaints), ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', CURRENT_TIMESTAMP)
    `);
    stmt.run(voter_id, booth_id, finalCategory, description, imageUrl, address || '', deptName, area);
    res.status(201).json({
      message: 'Complaint submitted',
      category: finalCategory,
      area,
      department: deptName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/complaints/voter/:id ─────────────────────────────────────────────
router.get('/voter/:id', (req, res) => {
  try {
    const complaints = db.prepare(
      'SELECT * FROM complaints WHERE voter_id = ? ORDER BY createdAt DESC'
    ).all(req.params.id);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
