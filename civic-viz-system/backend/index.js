const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const path = require('path');

// Initialize Database
const db = require('./db');
console.log('SQLite Database Initialized');

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const vizRoutes = require('./routes/viz');
const departmentRoutes = require('./routes/department');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/viz', vizRoutes);
app.use('/api/department', departmentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
