const express = require('express');
const router = express.Router();
const Report = require('../models/report');
const crypto = require('crypto');
const multer = require('multer');
const { uploadFileToPinata } = require('../utils/pinata');
const { storeHashOnChain, updateStatusOnChain, verifyHashOnChain } = require('../utils/blockchain');
const auth = require('../middleware/auth');

// Memory storage for stability
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST: submit a report (Single image only)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { category, description, locationText, longitude, latitude } = req.body;
    let imageCID = 'NO_IMAGE';

    if (req.file) {
      imageCID = await uploadFileToPinata(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const reportId = new Date().getTime().toString();
    const blockchainHash = crypto
      .createHash('sha256')
      .update(reportId + description + locationText + category + imageCID)
      .digest('hex');

    const reportData = {
      reportId,
      description,
      locationText,
      category,
      imageCID,
      blockchainHash,
      status: 'Pending',
      userId: req.user.id,
    };

    if (longitude && latitude) {
      reportData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    const report = new Report(reportData);
    await report.save();

    const txHash = await storeHashOnChain(reportId, blockchainHash);
    if (txHash) {
      report.txHash = txHash;
      await report.save();
    }

    res.status(201).json({
      message: 'Report submitted successfully!',
      reportId,
      txHash: txHash || 'Blockchain pending',
      status: report.status
    });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET: all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    const processed = reports.map(r => {
      const recalculatedHash = crypto
        .createHash('sha256')
        .update(r.reportId + r.description + r.locationText + r.category + (r.imageCID || 'NO_IMAGE'))
        .digest('hex');
      return {
        ...r.toObject(),
        isTampered: r.blockchainHash && r.txHash && r.txHash !== 'Blockchain pending' 
          ? recalculatedHash !== r.blockchainHash 
          : false
      };
    });
    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const processed = reports.map(r => {
      const recalculatedHash = crypto
        .createHash('sha256')
        .update(r.reportId + r.description + r.locationText + r.category + (r.imageCID || 'NO_IMAGE'))
        .digest('hex');
      return {
        ...r.toObject(),
        isTampered: r.blockchainHash && r.txHash && r.txHash !== 'Blockchain pending' 
          ? recalculatedHash !== r.blockchainHash 
          : false
      };
    });
    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'investigator') return res.status(403).json({ error: 'Not authorized' });
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:reportId', async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.reportId });
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:reportId/verify', async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.reportId });
    if (!report) return res.status(404).json({ error: 'Not found' });
    const recalculatedHash = crypto
      .createHash('sha256')
      .update(report.reportId + report.description + report.locationText + report.category + (report.imageCID || 'NO_IMAGE'))
      .digest('hex');
    const result = await verifyHashOnChain(report.reportId, recalculatedHash);
    res.json({ ...result, reportId: report.reportId, blockchainHash: report.blockchainHash, recalculatedHash });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/:reportId/upvote', auth, async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.reportId });
    if (!report) return res.status(404).json({ error: 'Not found' });
    if (report.upvotedBy && report.upvotedBy.includes(req.user.id)) return res.status(400).json({ error: 'Already upvoted' });
    report.upvotes += 1;
    if (!report.upvotedBy) report.upvotedBy = [];
    report.upvotedBy.push(req.user.id);
    await report.save();
    res.json({ message: 'Upvoted', upvotes: report.upvotes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:reportId/dispute', auth, async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.reportId });
    if (!report) return res.status(404).json({ error: 'Not found' });
    if (report.disputedBy && report.disputedBy.includes(req.user.id)) return res.status(400).json({ error: 'Already disputed' });
    report.disputes += 1;
    if (!report.disputedBy) report.disputedBy = [];
    report.disputedBy.push(req.user.id);
    await report.save();
    res.json({ message: 'Disputed', disputes: report.disputes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:reportId/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'investigator') return res.status(403).json({ error: 'Not authorized' });
    const { status } = req.body;
    const report = await Report.findOneAndUpdate({ reportId: req.params.reportId }, { status }, { new: true });
    await updateStatusOnChain(req.params.reportId, status);
    res.json({ message: 'Status updated', status: report.status });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:reportId/messages', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const report = await Report.findOne({ reportId: req.params.reportId });
    if (!report) return res.status(404).json({ error: 'Not found' });
    const newMessage = { senderId: req.user.id, senderRole: req.user.role, text, createdAt: new Date() };
    report.messages.push(newMessage);
    await report.save();
    res.status(201).json({ message: 'Sent', newMessage });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:reportId/messages', auth, async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.reportId });
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json({ messages: report.messages || [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;