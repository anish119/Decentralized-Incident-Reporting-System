const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const InvestigatorCode = require('../models/InvestigatorCode');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
};

// @route   POST /admin/generate-investigator-code
// @desc    Generate a random investigator invite code
// @access  Private (Admin only)
router.post('/generate-investigator-code', [auth, isAdmin], async (req, res) => {
  try {
    const code = 'INV_' + crypto.randomBytes(3).toString('hex').toUpperCase();
    
    const newCode = new InvestigatorCode({
      code: code
    });

    await newCode.save();

    res.json({ code });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
