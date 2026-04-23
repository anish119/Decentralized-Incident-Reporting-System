const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  locationText: { type: String, required: true },
  category: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }               // [longitude, latitude]
  },
  imageCID: { type: String },                     // Image CID from Pinata
  evidenceType: { type: String, default: 'image' },
  blockchainHash: { type: String },
  txHash: { type: String, default: null },
  status: { type: String, default: 'Pending Review' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: { type: Number, default: 0 },
  disputes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  disputedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedInvestigator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderRole: { type: String, enum: ['user', 'investigator'] },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Create index for location-based searches
reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);