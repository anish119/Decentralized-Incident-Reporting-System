const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ethers } = require('ethers');
const User = require('../models/User');

// POST: /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, specializations, walletAddress } = req.body;

    if (!username || !password || !walletAddress) {
      return res.status(400).json({ msg: 'Please enter all fields, including wallet address' });
    }

    // Check for existing user or wallet
    let user = await User.findOne({ $or: [{ username }, { walletAddress: walletAddress.toLowerCase() }] });
    if (user) {
      return res.status(400).json({ msg: 'User or wallet already exists' });
    }

    user = new User({
      username,
      password,
      walletAddress: walletAddress.toLowerCase(),
      role: role || 'user',
      specializations: role === 'investigator' && specializations ? specializations : []
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        specializations: user.specializations
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            specializations: user.specializations,
            walletAddress: user.walletAddress
          }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST: /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, walletAddress, signature } = req.body;

    // Validate
    if (!username || !password || !walletAddress || !signature) {
      return res.status(400).json({ msg: 'Please provide username, password, and MetaMask signature' });
    }

    // Check for user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Validate wallet address match
    if (user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ msg: 'Wallet address does not match this user' });
    }

    // Validate nonce exists
    if (!user.nonce) {
      return res.status(400).json({ msg: 'Nonce not found. Please request a login nonce first.' });
    }

    // Prepare message and verify signature
    const message = `Please sign this message to login to the Decentralized Incident Reporting System.\n\nNonce: ${user.nonce}`;
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (err) {
      return res.status(400).json({ msg: 'Invalid signature format' });
    }

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ msg: 'Signature verification failed' });
    }

    // Clear nonce after successful login
    user.nonce = undefined;
    await user.save();

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        specializations: user.specializations
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            specializations: user.specializations,
            walletAddress: user.walletAddress
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET: /auth/nonce/:walletAddress
router.get('/nonce/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({ msg: 'Wallet address is required' });
    }

    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(400).json({ msg: 'User with this wallet address not found' });
    }

    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    user.nonce = nonce;
    await user.save();

    res.json({ nonce: user.nonce });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
