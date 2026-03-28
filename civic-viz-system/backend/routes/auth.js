const express = require('express');
const router = express.Router();
const db = require('../db');
const { allocateBooth, getAllBooths, getAllAreas, getBoothById } = require('../boothAllocator');

// ── POST /api/auth/login ───────────────────────────────────────────────────────
// Voter ID lookup with fallback to unregistered_users
router.post('/login', (req, res) => {
  const { voter_id } = req.body;
  if (!voter_id) return res.status(400).json({ error: 'voter_id required' });
  try {
    // 1. Check registered voters table
    let voter = db.prepare('SELECT * FROM voters WHERE voter_id = ?').get(voter_id);
    if (voter) {
      // If voter has no booth_id yet, allocate one now
      if (!voter.booth_id) {
        const booth = allocateBooth({ area: voter.area || '' });
        db.prepare('UPDATE voters SET booth_id = ?, area = ? WHERE voter_id = ?')
          .run(booth.booth_id, booth.area, voter_id);
        voter = { ...voter, booth_id: booth.booth_id, area: booth.area };
      }
      return res.json({ ...voter, source: 'registered' });
    }

    const guest = db.prepare('SELECT * FROM unregistered_users WHERE id = ?').get(voter_id);
    if (guest) {
      return res.json({ ...guest, voter_id: `GUEST-${guest.id}`, source: 'guest', email: guest.email || null });
    }

    return res.status(404).json({ message: 'Voter ID not found in electoral roll' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Self-registration for citizens not in voter DB
router.post('/register', (req, res) => {
  const { voter_id, name, address, pincode, area, phone, email } = req.body;
  if (!voter_id) return res.status(400).json({ error: 'voter_id is required' });

  try {
    // Check if voter_id already exists
    const existing = db.prepare('SELECT voter_id FROM voters WHERE voter_id = ?').get(voter_id);
    if (existing) {
      return res.status(400).json({ error: 'This Voter ID is already registered.' });
    }

    // Allocate booth based on pincode/address/area
    const booth = allocateBooth({ pincode, address, area });

    db.prepare(`
      INSERT INTO voters (voter_id, name, address, pincode, area, booth_id, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(voter_id, name || 'Citizen', address || '', pincode || '', booth.area, booth.booth_id, phone || '', email || '');

    res.status(201).json({
      voter_id: voter_id,
      name: name || 'Citizen',
      address: address || '',
      pincode: pincode || '',
      area: booth.area,
      booth_id: booth.booth_id,
      booth_name: booth.booth_name,
      ward_number: booth.ward_number,
      source: 'guest',
      email: email || '',
      message: `Registered! Allocated to ${booth.booth_name}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/allocate-booth ─────────────────────────────────────────────
// Preview booth allocation without registering (for UI preview)
router.post('/allocate-booth', (req, res) => {
  const { pincode, address, area, voter_id } = req.body;

  try {
    // If voter_id provided, look up existing booth
    if (voter_id) {
      const voter = db.prepare('SELECT * FROM voters WHERE voter_id = ?').get(voter_id);
      if (voter && voter.booth_id) {
        const booth = getBoothById(voter.booth_id);
        return res.json({ ...booth, source: 'voter_db' });
      }
    }

    const booth = allocateBooth({ pincode, address, area });
    res.json({ ...booth, source: pincode ? 'pincode' : area ? 'area' : 'address' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/booths ──────────────────────────────────────────────────────
// Return all booths (for admin select / dropdowns)
router.get('/booths', (req, res) => {
  try {
    const { area } = req.query;
    let booths = getAllBooths();
    if (area) booths = booths.filter(b => b.area.toLowerCase() === area.toLowerCase());
    res.json(booths);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/areas ───────────────────────────────────────────────────────
// Return all available areas
router.get('/areas', (req, res) => {
  try {
    res.json(getAllAreas());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
