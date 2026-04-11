const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const { syncReportsToBlockchain } = require('./utils/syncReports');

app.use(cors());
app.use(express.json());

// Request logger for debugging multipart issues
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | Content-Type: ${req.headers['content-type']}`);
  next();
});

const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
app.use('/reports', reportRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔴 Global error handler:', err.message);
  res.status(err.status || 400).json({ error: err.message || 'Server error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected!');
    await syncReportsToBlockchain();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));