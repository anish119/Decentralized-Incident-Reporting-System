const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, required: true, unique: true },
  nonce: { type: String }, // Used for MetaMask signature validation
  role: { type: String, enum: ['user', 'investigator', 'admin'], default: 'user' },
  specializations: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
